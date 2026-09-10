import { DOCUMENT_ID } from '../../core/config/resources';
import {
  buildReminderEmail,
  deadlineSentence,
  formatEmailDate,
  type DeadlineContext,
} from '../../core/email/reminder-template';
import type { SectionValidation } from './types';

const PW_SETLIST_URL = `https://docs.google.com/document/d/${DOCUMENT_ID}`;

function buildPwAction() {
  return {
    label: 'Open P&W setlist document',
    url: PW_SETLIST_URL,
  };
}

export function buildAdminEmail(sectionName: string, deadline: DeadlineContext) {
  return buildReminderEmail({
    title: 'Missing Leader Assignment',
    tone: 'critical',
    highlightTitle: `No leader is assigned for ${sectionName}`,
    paragraphs: [
      `The ${sectionName} section is still missing a leader email in the setlist document, so nobody is being reminded to pick its songs.`,
      deadlineSentence(deadline),
      'Please update the document so MD Bot 🤖 can send reminders to the correct person.',
    ],
    action: buildPwAction(),
  });
}

// Unlike the leader reminders, this one names the service date: the whole point
// is which heading is missing, so the date is the actionable part rather than a
// distraction from the deadline.
export function buildMissingServiceEmail(targetSunday: string, deadline: DeadlineContext) {
  const formattedDate = formatEmailDate(targetSunday);

  return buildReminderEmail({
    title: 'No Service Section Yet',
    tone: deadline.tone,
    highlightTitle: `${deadline.countdown} — nothing in the document for ${formattedDate}`,
    paragraphs: [
      `The setlist document has no dated heading for ${formattedDate}, so there are no sections to check and no leaders are being reminded to pick songs.`,
      deadlineSentence(deadline),
      'Add the dated service heading and reminders will start going out on the next run.',
    ],
    action: buildPwAction(),
  });
}

export function buildLeaderEmail(validation: SectionValidation, deadline: DeadlineContext) {
  if (validation.status === 'missing_songs') {
    return buildReminderEmail({
      title: 'Setlist Reminder',
      tone: deadline.tone,
      highlightTitle: `${deadline.countdown} — ${validation.sectionName} still needs song selections`,
      paragraphs: [
        deadlineSentence(deadline),
        `Your ${validation.sectionName} section does not have any songs listed yet. Add your selections and a YouTube link for each one.`,
      ],
      action: buildPwAction(),
    });
  }

  if (validation.status === 'missing_links') {
    return buildReminderEmail({
      title: 'Setlist Reminder',
      tone: deadline.tone,
      highlightTitle: `${deadline.countdown} — ${validation.sectionName} is missing YouTube links`,
      paragraphs: [
        deadlineSentence(deadline),
        `Your ${validation.sectionName} section has songs entered, but some are still missing links. The team prepares from those references, so please add them.`,
      ],
      bullets: validation.songsWithoutLinks,
      action: buildPwAction(),
    });
  }

  return buildReminderEmail({
    title: 'Setlist Reminder',
    tone: 'info',
    highlightTitle: `${validation.sectionName} is ready`,
    paragraphs: [`No follow-up is needed for ${validation.sectionName}.`],
    action: buildPwAction(),
  });
}
