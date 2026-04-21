import { HGH_SHEET_ID } from '../../core/config/resources';
import {
  buildReminderEmail,
  formatEmailDate,
} from '../../core/email/reminder-template';

export function buildHghSelectionReminderEmail(targetSunday: string) {
  const formattedDate = formatEmailDate(targetSunday);

  return buildReminderEmail({
    title: 'HGH: Song Not Yet Logged',
    metaLine: `For ${formattedDate}`,
    tone: 'warning',
    highlightTitle: `No HGH song has been logged for ${formattedDate}`,
    paragraphs: [
      'The HGH Song Collection sheet does not show an entry for the upcoming service.',
      'Please update the sheet with the planned song selection.',
    ],
    action: {
      label: 'Open HGH Song Collection sheet',
      url: `https://docs.google.com/spreadsheets/d/${HGH_SHEET_ID}`,
    },
  });
}
