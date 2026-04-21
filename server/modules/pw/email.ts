import { DOCUMENT_ID } from '../../core/config/resources';
import { buildReminderEmail } from '../../core/email/reminder-template';
import type { SectionValidation } from './types';

const PW_SETLIST_URL = `https://docs.google.com/document/d/${DOCUMENT_ID}`;

function buildPwAction() {
  return {
    label: 'Open P&W setlist document',
    url: PW_SETLIST_URL,
  };
}

export function buildAdminEmail(sectionName: string, formattedDate: string) {
  return buildReminderEmail({
    title: 'Missing Leader Assignment',
    metaLine: `For ${formattedDate}`,
    tone: 'critical',
    highlightTitle: `No leader is assigned for ${sectionName}`,
    paragraphs: [
      `The ${sectionName} section is still missing a leader email in the setlist document.`,
      'Please update the document so MD Bot 🤖 can send reminders to the correct person.',
    ],
    action: buildPwAction(),
  });
}

export function buildLeaderEmail(validation: SectionValidation, formattedDate: string) {
  if (validation.status === 'missing_songs') {
    return buildReminderEmail({
      title: 'Setlist Reminder',
      metaLine: `For ${formattedDate}`,
      tone: 'warning',
      highlightTitle: `${validation.sectionName} still needs song selections`,
      paragraphs: [
        `Your ${validation.sectionName} section does not have any songs listed yet.`,
        'Please add your song selections and include YouTube links for each song in the setlist document.',
      ],
      action: buildPwAction(),
    });
  }

  if (validation.status === 'missing_links') {
    return buildReminderEmail({
      title: 'Setlist Reminder',
      metaLine: `For ${formattedDate}`,
      tone: 'warning',
      highlightTitle: `${validation.sectionName} is missing YouTube links`,
      paragraphs: [
        `Your ${validation.sectionName} section has songs entered, but some are still missing YouTube links.`,
        'Please add the missing links in the setlist document so the team can prepare from the right references.',
      ],
      bullets: validation.songsWithoutLinks,
      action: buildPwAction(),
    });
  }

  return buildReminderEmail({
    title: 'Setlist Reminder',
    metaLine: `For ${formattedDate}`,
    tone: 'info',
    highlightTitle: `${validation.sectionName} is ready`,
    paragraphs: [`No follow-up is needed for ${validation.sectionName}.`],
    action: buildPwAction(),
  });
}
