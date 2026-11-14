import { HGH_SHEET_ID } from '../../core/config/resources';
import {
  buildReminderEmail,
  scheduleLines,
  type DeadlineContext,
} from '../../core/email/reminder-template';

export function buildHghSelectionReminderEmail(deadline: DeadlineContext) {
  return buildReminderEmail({
    title: 'His Glory Heralds: Song Not Yet Logged',
    tone: deadline.tone,
    highlightTitle: `${deadline.countdown} — His Glory Heralds has no song logged`,
    highlightLines: scheduleLines(deadline),
    paragraphs: [
      'The His Glory Heralds Song Collection sheet does not show an entry yet. Please update it with the planned song selection.',
    ],
    action: {
      label: 'Open His Glory Heralds Song Collection sheet',
      url: `https://docs.google.com/spreadsheets/d/${HGH_SHEET_ID}`,
    },
  });
}
