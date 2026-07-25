import { CELESTIAL_COL_DATE, CELESTIAL_COL_EVENT, CELESTIAL_COL_SONG, CELESTIAL_SHEET_ID, CELESTIAL_SHEET_TAB, getAdminEmail, getCelestialChoirEmails } from '../../core/config/resources';
import { createRunId } from '../../core/email/history';
import { sendTrackedEmail } from '../../core/email/mailer';
import { readSheetTab } from '../../core/google/sheets';
import { log } from '../../core/logging/log';
import { formatISODate, getTargetSunday, getWeekWindow } from '../../core/scheduling/target-sunday';
import { getPhonesForEmails } from '../../core/sms/contacts';
import { getAdminPhone, sendTrackedSms } from '../../core/sms/texter';
import { buildCelestialMissingHymnEmail } from './email';
import type { CelestialCheckResult, CelestialHymnRecord, CelestialWeekStatus } from './types';

// ── Sheet reader ──────────────────────────────────────────────────────────────

export async function fetchCelestialHymns(): Promise<CelestialHymnRecord[]> {
  // Row 1 is headers (Date, Song Link, Event), data starts row 2
  const rows = await readSheetTab(CELESTIAL_SHEET_ID, CELESTIAL_SHEET_TAB, 2);

  const records: CelestialHymnRecord[] = [];

  for (const row of rows) {
    const rawDate = (row[CELESTIAL_COL_DATE] || '').trim();
    if (!rawDate) continue;

    const parsedDate = parseCelestialDate(rawDate);
    if (!parsedDate) continue;

    records.push({
      date: parsedDate,
      songLink: (row[CELESTIAL_COL_SONG] || '').trim() || null,
      event: (row[CELESTIAL_COL_EVENT] || '').trim() || null,
    });
  }

  return records;
}

// ── Date parser ───────────────────────────────────────────────────────────────
// Sheet stores dates as M/D/YYYY (e.g. "1/4/2026", "12/27/2026")

function parseCelestialDate(raw: string): string | null {
  // Try M/D/YYYY or MM/DD/YYYY
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }
  return null;
}

// ── Main checker ──────────────────────────────────────────────────────────────

export async function checkCelestialHymn(
  targetSunday: Date
): Promise<CelestialCheckResult> {
  const targetISO = formatISODate(targetSunday);
  log(`Checking Celestial Choir hymn for ${targetISO}`, 'celestial');

  const hymns = await fetchCelestialHymns();
  const record = hymns.find((h) => h.date === targetISO);

  const hymnSelected = !!record?.songLink;

  log(
    `Celestial hymn for ${targetISO}: ${hymnSelected ? 'selected ✓' : 'NOT selected ✗'}`,
    'celestial'
  );

  return {
    targetSunday: targetISO,
    event: record?.event ?? null,
    hymnSelected,
    songLink: record?.songLink ?? null,
    emailSent: false, // updated by caller after email is sent
    ranAt: new Date().toISOString(),
  };
}

/**
 * Week-aware status for the dashboard. Mirrors how P&W works: scan this group's
 * own source (the Celestial sheet) for every dated entry in the Monday→Sunday
 * window leading up to the target Sunday, and report each one. Weeks with more
 * than one service (e.g. a mid-week service plus the Sunday) surface each date
 * rather than only the Sunday. When the sheet has no entry in the window, fall
 * back to a single not-selected row for the target Sunday so the missing state
 * still shows.
 */
export async function getCelestialWeekStatus(
  targetSunday: Date = getTargetSunday()
): Promise<CelestialWeekStatus> {
  const targetISO = formatISODate(targetSunday);
  const { start, end } = getWeekWindow(targetSunday);
  const hymns = await fetchCelestialHymns();

  // One row per date the choir has in the week; the Sunday (the main service
  // and the reminder target) is always shown even when the sheet has no row for
  // it yet. Extra mid-week dates only appear when the choir has an entry.
  const byDate = new Map<string, CelestialWeekStatus['services'][number]>();
  for (const h of hymns) {
    if (h.date < start || h.date > end) continue;
    byDate.set(h.date, {
      date: h.date,
      event: h.event,
      hymnSelected: !!h.songLink,
      songLink: h.songLink,
      title: hymnTitle(h.songLink),
    });
  }
  if (!byDate.has(targetISO)) {
    byDate.set(targetISO, { date: targetISO, event: null, hymnSelected: false, songLink: null, title: null });
  }

  const services = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  return {
    targetSunday: targetISO,
    services,
    hymnSelected: services.every((s) => s.hymnSelected),
  };
}

// The Celestial song cell usually holds the hymn name (with a hyperlink behind
// it), which reads FORMATTED as the title. When the cell is a bare URL instead,
// there's no clean name to show, so fall back to null.
function hymnTitle(songLink: string | null): string | null {
  if (!songLink) return null;
  return /^https?:\/\//i.test(songLink) ? null : songLink;
}

export async function runCelestialCheck(
  trigger: 'scheduled' | 'manual' = 'manual'
): Promise<CelestialCheckResult> {
  const runId = createRunId();
  const recipients = getCelestialChoirEmails();
  const result = await checkCelestialHymn(getTargetSunday());
  log(`Running Celestial hymn check (trigger: ${trigger}) for ${result.targetSunday}`, 'celestial');

  if (!result.hymnSelected) {
    try {
      const email = buildCelestialMissingHymnEmail(result);
      const subject = `Action needed: Celestial Choir has not selected a hymn for ${result.targetSunday}`;
      await sendTrackedEmail({
        to: recipients,
        subject,
        body: email.text,
        html: email.html,
        history: {
          runId,
          module: 'celestial',
          kind: 'celestial_missing_hymn',
          trigger,
          targetSunday: result.targetSunday,
          payload: {
            event: result.event,
            hymnSelected: result.hymnSelected,
            songLink: result.songLink,
          },
        },
      });
      result.emailSent = true;
      log(`Celestial missing hymn alert sent to ${recipients.join(', ')}`, 'celestial');
    } catch (err: any) {
      log(`Failed to send Celestial alert email: ${err.message}`, 'celestial');
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
            body: `[MD Bot] Action needed: no hymn has been logged for Celestial Choir this Sunday (${result.targetSunday}). Check your email for more details.`,
            module: 'celestial',
            trigger,
            runId,
          });
        }
      } catch (err: any) {
        log(`Failed to send Celestial alert SMS: ${err.message}`, 'celestial');
      }
    }
  } else {
    log(`Celestial hymn already selected for ${result.targetSunday} - no email needed`, 'celestial');
  }

  return result;
}
