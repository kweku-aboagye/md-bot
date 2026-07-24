import { CELESTIAL_COL_DATE, CELESTIAL_COL_SONG, CELESTIAL_SHEET_ID, CELESTIAL_SHEET_TAB, DOCUMENT_ID, getAdminEmail, getZamarBandEmails, HGH_COL_DATE, HGH_COL_TITLE, HGH_DATA_START_ROW, HGH_SHEET_ID, HGH_SHEET_TAB } from '../../core/config/resources';
import { createRunId } from '../../core/email/history';
import { sendTrackedEmail } from '../../core/email/mailer';
import { formatEmailDate } from '../../core/email/reminder-template';
import { readCellLink, readSheetTab } from '../../core/google/sheets';
import { log } from '../../core/logging/log';
import { formatISODate, getTargetSunday, getWeekWindow } from '../../core/scheduling/target-sunday';
import { getPhonesForEmails } from '../../core/sms/contacts';
import { getAdminPhone, sendTrackedSms } from '../../core/sms/texter';
import { getServicesForWeek } from '../pw/document-reader';
import { buildZamarPrepEmail } from './email';
import type { ZamarPrepResult, ZamarSong } from './types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMDYDate(raw: string): string | null {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const d = new Date(
      Date.UTC(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]))
    );
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  return null;
}

function columnIndexToLetter(index: number): string {
  let value = index;
  let column = '';

  while (value >= 0) {
    column = String.fromCharCode((value % 26) + 65) + column;
    value = Math.floor(value / 26) - 1;
  }

  return column;
}

// ── P&W songs ─────────────────────────────────────────────────────────────────

async function getPWSongs(targetSunday: Date): Promise<ZamarSong[]> {
  const weekServices = await getServicesForWeek(DOCUMENT_ID, targetSunday);
  const songs: ZamarSong[] = [];

  for (const svc of weekServices) {
    for (const section of svc.sections) {
      for (const song of section.songs) {
        songs.push({
          title: song.title,
          youtubeUrl: song.youtubeUrl,
          group: 'P&W',
          section: section.name,
          serviceDate: svc.serviceDate,
        });
      }
    }
  }

  return songs;
}

// ── HGH songs ─────────────────────────────────────────────────────────────────
// The HGH sheet logs the song ministered each service. We read every row whose
// date falls in the target Sunday's week (Mon→Sun) so a mid-week ministration is
// compiled for band prep too, not just the Sunday. Each song is tagged with its
// service date.

async function getHGHSongs(targetSunday: Date): Promise<ZamarSong[]> {
  const { start, end } = getWeekWindow(targetSunday);
  const startRow = HGH_DATA_START_ROW + 1;

  // Start from row 3 (skip title row 1 and header row 2)
  const rows = await readSheetTab(HGH_SHEET_ID, HGH_SHEET_TAB, startRow);

  const found: Array<{ title: string; serviceDate: string; rowNumber: number }> = [];
  for (const [index, row] of rows.entries()) {
    const rawDate = (row[HGH_COL_DATE] || '').trim();
    const rawTitle = (row[HGH_COL_TITLE] || '').trim();

    if (!rawDate || !rawTitle) continue;
    if (rawTitle.toLowerCase() === 'not ministering') continue;
    if (rawTitle.toLowerCase() === 'online service') continue;

    // HGH dates are stored as M/D/YYYY
    const parsedDate = parseMDYDate(rawDate);
    if (!parsedDate || parsedDate < start || parsedDate > end) continue;

    found.push({ title: rawTitle, serviceDate: parsedDate, rowNumber: startRow + index });
  }

  const songs = await Promise.all(
    found.map(async ({ title, serviceDate, rowNumber }): Promise<ZamarSong> => {
      const titleCell = await readCellLink(
        HGH_SHEET_ID,
        HGH_SHEET_TAB,
        columnIndexToLetter(HGH_COL_TITLE),
        rowNumber
      );
      return { title, youtubeUrl: titleCell.url || null, group: 'HGH', serviceDate };
    })
  );

  return songs.sort((a, b) => (a.serviceDate ?? '').localeCompare(b.serviceDate ?? ''));
}

// ── Celestial songs ───────────────────────────────────────────────────────────

async function getCelestialSongs(targetSunday: Date): Promise<ZamarSong[]> {
  const { start, end } = getWeekWindow(targetSunday);
  const startRow = 2;

  const rows = await readSheetTab(CELESTIAL_SHEET_ID, CELESTIAL_SHEET_TAB, startRow);

  const found: Array<{ rawTitle: string; serviceDate: string; rowNumber: number }> = [];
  for (const [index, row] of rows.entries()) {
    const rawDate = (row[CELESTIAL_COL_DATE] || '').trim();
    if (!rawDate) continue;

    const parsedDate = parseMDYDate(rawDate);
    if (!parsedDate || parsedDate < start || parsedDate > end) continue;

    const rawTitle = (row[CELESTIAL_COL_SONG] || '').trim();
    if (!rawTitle) continue;

    found.push({ rawTitle, serviceDate: parsedDate, rowNumber: startRow + index });
  }

  const songs = await Promise.all(
    found.map(async ({ rawTitle, serviceDate, rowNumber }): Promise<ZamarSong> => {
      const songCell = await readCellLink(
        CELESTIAL_SHEET_ID,
        CELESTIAL_SHEET_TAB,
        columnIndexToLetter(CELESTIAL_COL_SONG),
        rowNumber
      );
      const title = songCell.displayText.trim() || rawTitle;
      return {
        title,
        youtubeUrl: songCell.url || (rawTitle.startsWith('http') ? rawTitle : null),
        group: 'Celestial',
        serviceDate,
      };
    })
  );

  return songs
    .filter((s) => s.title)
    .sort((a, b) => (a.serviceDate ?? '').localeCompare(b.serviceDate ?? ''));
}

// ── Main compiler ─────────────────────────────────────────────────────────────

export async function compileZamarPrepList(
  targetSunday?: Date
): Promise<ZamarPrepResult> {
  const sunday = targetSunday ?? getTargetSunday();
  const targetISO = formatISODate(sunday);

  log(`Compiling Zamar prep list for ${targetISO}`, 'zamar');

  const [pwSongs, hghSongs, celestialSongs] = await Promise.all([
    getPWSongs(sunday),
    getHGHSongs(sunday),
    getCelestialSongs(sunday),
  ]);

  const songs: ZamarSong[] = [...pwSongs, ...hghSongs, ...celestialSongs];

  log(
    `Zamar prep list: ${pwSongs.length} P&W songs, ${hghSongs.length} HGH song(s), ${celestialSongs.length} Celestial song(s)`,
    'zamar'
  );

  return {
    targetSunday: targetISO,
    songs,
    emailSent: false, // updated by caller after sending
    ranAt: new Date().toISOString(),
  };
}

export async function runZamarPrep(
  trigger: 'scheduled' | 'manual' = 'manual'
): Promise<ZamarPrepResult> {
  const runId = createRunId();
  const recipients = getZamarBandEmails();
  log(`Compiling and sending Zamar prep list (trigger: ${trigger})`, 'zamar');
  const result = await compileZamarPrepList();

  try {
    await sendTrackedEmail({
      to: recipients,
      subject: `Zamar Band Prep List — ${formatEmailDate(result.targetSunday)} (${result.songs.length} songs)`,
      html: buildZamarPrepEmail(result),
      history: {
        runId,
        module: 'zamar',
        kind: 'zamar_prep_list',
        trigger,
        targetSunday: result.targetSunday,
        payload: {
          songCount: result.songs.length,
          songs: result.songs,
        },
      },
    });
    result.emailSent = true;
    log(`Zamar prep list sent to ${recipients.join(', ')}`, 'zamar');
  } catch (err: any) {
    log(`Failed to send Zamar prep list email: ${err.message}`, 'zamar');
  }

  if (result.emailSent) {
    try {
      const adminEmail = getAdminEmail();
      const groupEmails = recipients.filter(e => e !== adminEmail);
      const groupPhones = await getPhonesForEmails(groupEmails);
      const adminPhone = getAdminPhone();
      const allPhones = [...new Set([...groupPhones, ...(adminPhone ? [adminPhone] : [])])];
      if (allPhones.length > 0) {
        await sendTrackedSms({
          to: allPhones,
          body: `[MD Bot] Zamar Band prep list for Sunday (${result.targetSunday}) is ready — ${result.songs.length} songs. Check your email for more details.`,
          module: 'zamar',
          trigger,
          runId,
        });
      }
    } catch (err: any) {
      log(`Failed to send Zamar prep list SMS: ${err.message}`, 'zamar');
    }
  }

  return result;
}
