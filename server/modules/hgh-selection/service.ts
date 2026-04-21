/**
 * hghSelection.ts
 *
 * HGH Song Selection reminder module.
 *
 * Distinct from hghGapFinder.ts (which compares the YouTube playlist against
 * the performance history). This module answers a simpler question: has HGH
 * logged a song for the target Sunday yet? If not, send a reminder.
 *
 * Sheet config (from schema.ts):
 *   ID:    HGH_SHEET_ID
 *   Tab:   "Current"
 *   Col A (0):  Song Title
 *   Col B (1):  Date Performed  (format: M/D/YYYY — e.g. "4/13/2026")
 *
 * Logic: find a row where col B matches the dashboard target Sunday AND col A is
 * non-empty. A match means the song has already been selected/pre-logged.
 *
 * Requires env vars:
 *   ADMIN_EMAIL             — set in schema.ts constant
 *   Either RESEND_API_KEY / RESEND_FROM_EMAIL
 *   or GMAIL_USER / GMAIL_APP_PASSWORD
 */

import { getAdminEmail, HGH_COL_DATE, HGH_COL_TITLE, HGH_SHEET_ID, HGH_SHEET_TAB } from '../../core/config/resources';
import { createRunId } from '../../core/email/history';
import { sendTrackedEmail } from '../../core/email/mailer';
import { log } from '../../core/logging/log';
import { formatISODate, getTargetSunday } from '../../core/scheduling/target-sunday';
import { getAdminPhone, sendTrackedSms } from '../../core/sms/texter';
import { isSheetEntryFilledForDate } from './checker';
import { buildHghSelectionReminderEmail } from './email';
import type { HghSelectionStatus } from './types';

const HGH_SELECTION_CONFIG = {
  sheetId: HGH_SHEET_ID,
  tabName: HGH_SHEET_TAB,        // "Current"
  dateColumn: HGH_COL_DATE,      // Col B (1): Date Performed
  songColumn: HGH_COL_TITLE,     // Col A (0): Song Title
};

export async function getHghSelectionStatus(targetSunday = getTargetSunday()): Promise<HghSelectionStatus> {
  const songSelected = await isSheetEntryFilledForDate(HGH_SELECTION_CONFIG, targetSunday);

  return {
    songSelected,
    targetSunday: formatISODate(targetSunday),
  };
}

export async function checkHGHSelectionAndNotify(
  trigger: 'scheduled' | 'manual' = 'manual'
): Promise<void> {
  const runId = createRunId();
  const adminEmail = getAdminEmail();
  const status = await getHghSelectionStatus();
  log(`Checking HGH song selection for ${status.targetSunday}`, 'hgh-selection');

  if (status.songSelected) {
    log(`HGH song already logged for ${status.targetSunday} - no email sent`, 'hgh-selection');
    return;
  }

  log(`No HGH song logged for ${status.targetSunday} - sending reminder`, 'hgh-selection');

  const email = buildHghSelectionReminderEmail(status.targetSunday);
  await sendTrackedEmail({
    to: adminEmail,
    subject: `HGH: No song logged for ${status.targetSunday}`,
    body: email.text,
    html: email.html,
    history: {
      runId,
      module: 'hgh-selection',
      kind: 'hgh_selection_reminder',
      trigger,
      targetSunday: status.targetSunday,
      payload: {
        songSelected: status.songSelected,
      },
    },
  });

  log(`HGH selection reminder sent to ${adminEmail}`, 'hgh-selection');

  const adminPhone = getAdminPhone();
  if (adminPhone) {
    await sendTrackedSms({
      to: adminPhone,
      body: `[MD Bot] HGH reminder: no song has been logged for Sun ${status.targetSunday} yet. Check your email for details.`,
      module: 'hgh-selection',
      trigger,
      runId,
    });
  }
}
