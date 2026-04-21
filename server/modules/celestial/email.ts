import { CELESTIAL_SHEET_ID } from '../../core/config/resources';
import {
  buildReminderEmail,
  formatEmailDate,
} from '../../core/email/reminder-template';
import type { CelestialCheckResult } from './types';

export function buildCelestialMissingHymnEmail(result: CelestialCheckResult) {
  const formattedDate = formatEmailDate(result.targetSunday);

  return buildReminderEmail({
    title: 'Celestial Choir: Hymn Not Yet Selected',
    metaLine: `For ${formattedDate}`,
    tone: 'warning',
    highlightTitle: `No hymn has been chosen for ${formattedDate}`,
    highlightLines: result.event ? [`Event: ${result.event}`] : [],
    paragraphs: [
      'The Celestial Choir sheet does not show a hymn for the upcoming service.',
      'Please follow up with the President or Organizing Secretary to confirm the selection.',
    ],
    action: {
      label: 'Open Celestial Choir sheet',
      url: `https://docs.google.com/spreadsheets/d/${CELESTIAL_SHEET_ID}`,
    },
  });
}
