import { CELESTIAL_SHEET_ID } from '../../core/config/resources';
import {
  buildReminderEmail,
  deadlineSentence,
  type DeadlineContext,
} from '../../core/email/reminder-template';
import type { CelestialCheckResult } from './types';

export function buildCelestialMissingHymnEmail(
  result: CelestialCheckResult,
  deadline: DeadlineContext
) {
  return buildReminderEmail({
    title: 'Celestial Choir: Hymn Not Yet Selected',
    tone: deadline.tone,
    highlightTitle: `${deadline.countdown} — Celestial Choir has no hymn logged`,
    highlightLines: result.event ? [`Event: ${result.event}`] : [],
    paragraphs: [
      deadlineSentence(deadline),
      'The Celestial Choir sheet does not show a hymn yet. Please follow up with the President or Organizing Secretary to confirm the selection.',
    ],
    action: {
      label: 'Open Celestial Choir sheet',
      url: `https://docs.google.com/spreadsheets/d/${CELESTIAL_SHEET_ID}`,
    },
  });
}
