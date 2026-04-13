import { CELESTIAL_COL_DATE, CELESTIAL_COL_SONG, CELESTIAL_SHEET_ID, CELESTIAL_SHEET_TAB, DOCUMENT_ID, getZamarBandEmails, HGH_COL_DATE, HGH_COL_TITLE, HGH_DATA_START_ROW, HGH_SHEET_ID, HGH_SHEET_TAB } from '../../core/config/resources';
import { createRunId } from '../../core/email/history';
import { sendTrackedEmail } from '../../core/email/mailer';
import { readCellLink, readSheetTab } from '../../core/google/sheets';
import { log } from '../../core/logging/log';
import { formatISODate, getTargetSunday } from '../../core/scheduling/target-sunday';
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
        });
      }
    }
  }

  return songs;
}

// ── HGH song ──────────────────────────────────────────────────────────────────
// The HGH sheet logs the song ministered each Sunday.
// For the upcoming Sunday (targetSunday) the entry may not be logged yet —
// instead we read the most recently entered upcoming row.
// We look for the first row after today that has a song title set.

async function getHGHSong(targetSunday: Date): Promise<ZamarSong | null> {
  const targetISO = formatISODate(targetSunday);
  const startRow = HGH_DATA_START_ROW + 1;

  // Start from row 3 (skip title row 1 and header row 2)
  const rows = await readSheetTab(HGH_SHEET_ID, HGH_SHEET_TAB, startRow);

  for (const [index, row] of rows.entries()) {
    const rawDate = (row[HGH_COL_DATE] || '').trim();
    const rawTitle = (row[HGH_COL_TITLE] || '').trim();

    if (!rawDate || !rawTitle) continue;
    if (rawTitle.toLowerCase() === 'not ministering') continue;
    if (rawTitle.toLowerCase() === 'online service') continue;

    // Match exact Sunday date
    // HGH dates are stored as M/D/YYYY
    const parsedDate = parseMDYDate(rawDate);
    if (parsedDate === targetISO) {
      const sheetRowNumber = startRow + index;
      const titleCell = await readCellLink(
        HGH_SHEET_ID,
        HGH_SHEET_TAB,
        columnIndexToLetter(HGH_COL_TITLE),
        sheetRowNumber
      );

      return {
        title: rawTitle,
        youtubeUrl: titleCell.url || null,
        group: 'HGH',
      };
    }
  }

  return null;
}

// ── Celestial song ────────────────────────────────────────────────────────────

async function getCelestialSong(targetSunday: Date): Promise<ZamarSong | null> {
  const targetISO = formatISODate(targetSunday);

  const rows = await readSheetTab(CELESTIAL_SHEET_ID, CELESTIAL_SHEET_TAB, 2);

  for (const row of rows) {
    const rawDate = (row[CELESTIAL_COL_DATE] || '').trim();
    if (!rawDate) continue;

    const parsedDate = parseMDYDate(rawDate);
    if (parsedDate === targetISO) {
      const songLink = (row[CELESTIAL_COL_SONG] || '').trim() || null;
      if (!songLink) return null;

      return {
        title: songLink, // the cell text is the hymn title/link
        youtubeUrl: songLink.startsWith('http') ? songLink : null,
        group: 'Celestial',
      };
    }
  }

  return null;
}

// ── Main compiler ─────────────────────────────────────────────────────────────

export async function compileZamarPrepList(
  targetSunday?: Date
): Promise<ZamarPrepResult> {
  const sunday = targetSunday ?? getTargetSunday();
  const targetISO = formatISODate(sunday);

  log(`Compiling Zamar prep list for ${targetISO}`, 'zamar');

  const [pwSongs, hghSong, celestialSong] = await Promise.all([
    getPWSongs(sunday),
    getHGHSong(sunday),
    getCelestialSong(sunday),
  ]);

  const songs: ZamarSong[] = [
    ...pwSongs,
    ...(hghSong ? [hghSong] : []),
    ...(celestialSong ? [celestialSong] : []),
  ];

  log(
    `Zamar prep list: ${pwSongs.length} P&W songs, ${hghSong ? 1 : 0} HGH song, ${celestialSong ? 1 : 0} Celestial song`,
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
      subject: `Zamar Band Prep List — Sunday ${result.targetSunday} (${result.songs.length} songs)`,
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
    log(`Failed to send Zamar prep list: ${err.message}`, 'zamar');
  }

  return result;
}
