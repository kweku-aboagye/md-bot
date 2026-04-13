import { HGH_SHEET_ID } from '../../core/config/resources';
import {
  buildReminderEmail,
  formatEmailDate,
  formatEmailTime,
} from '../../core/email/reminder-template';

export function buildHghSelectionReminderEmail(targetSunday: string, ranAt: string) {
  return buildReminderEmail({
    title: 'HGH: Song Not Yet Logged',
    metaLine: `Checked ${formatEmailTime(ranAt)}`,
    tone: 'warning',
    highlightTitle: `No HGH song has been logged for ${formatEmailDate(targetSunday)}`,
    paragraphs: [
      'The HGH Song Collection sheet does not have an entry for the upcoming Sunday.',
      'Please update the sheet with the planned song selection.',
    ],
    action: {
      label: 'Open HGH Song Collection sheet',
      url: `https://docs.google.com/spreadsheets/d/${HGH_SHEET_ID}`,
    },
  });
}
