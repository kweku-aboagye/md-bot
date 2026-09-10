import { getAdminEmail, getPraiseAndWorshipEmails } from '../../core/config/resources';
import type { EmailTrigger } from '../../core/email/history';
import { sendTrackedEmail } from '../../core/email/mailer';
import { formatEmailDate, type DeadlineContext } from '../../core/email/reminder-template';
import { log } from '../../core/logging/log';
import { getPhoneForEmail, getPhonesForEmails } from '../../core/sms/contacts';
import { getAdminPhone, sendTrackedSms } from '../../core/sms/texter';
import { buildAdminEmail, buildLeaderEmail, buildMissingServiceEmail } from './email';
import type { EmailSent, SectionData, SectionStatus, SectionValidation, WeekData } from './types';

export function validateSections(weekData: WeekData): SectionValidation[] {
  // Merge duplicate section headings (same name appearing more than once in the doc)
  // into a single entry so we don't emit duplicate validations or duplicate emails.
  const merged = new Map<string, SectionData>();
  for (const section of weekData.sections) {
    const existing = merged.get(section.name);
    if (existing) {
      existing.songs.push(...section.songs);
      if (!existing.leaderEmail && section.leaderEmail) {
        existing.leaderEmail = section.leaderEmail;
      }
    } else {
      merged.set(section.name, { ...section, songs: [...section.songs] });
    }
  }

  const results: SectionValidation[] = [];

  for (const section of merged.values()) {
    const songsWithoutLinks = section.songs
      .filter((s) => !s.youtubeUrl)
      .map((s) => s.title);

    let status: SectionStatus;

    if (!section.leaderEmail) {
      status = 'missing_leader';
    } else if (section.songs.length === 0) {
      status = 'missing_songs';
    } else if (songsWithoutLinks.length > 0) {
      status = 'missing_links';
    } else {
      status = 'complete';
    }

    results.push({
      sectionName: section.name,
      leaderEmail: section.leaderEmail,
      status,
      songCount: section.songs.length,
      songsWithLinks: section.songs.filter((s) => s.youtubeUrl).length,
      songsWithoutLinks,
    });
  }

  return results;
}

/**
 * The document has no dated heading for the target week at all.
 *
 * This is not the same as a section being unfilled: with no heading there are no
 * sections, so there is nobody to remind and the run would otherwise send
 * nothing and only log an error. Routed like the missing-leader alert, to the
 * P&W list plus the admin — creating the dated heading is a job for whoever
 * maintains the document, not for a section leader.
 */
export async function sendMissingServiceEmail(options: {
  runId: string;
  trigger: EmailTrigger;
  targetSunday: string;
  deadline: DeadlineContext;
}): Promise<EmailSent[]> {
  const adminEmail = getAdminEmail();
  const pwRecipients = getPraiseAndWorshipEmails();
  const { deadline, targetSunday } = options;
  const formattedDate = formatEmailDate(targetSunday);

  if (pwRecipients.length === 0) {
    log('No recipients configured — skipping missing service section notification', 'validator');
    return [];
  }

  const emailsSent: EmailSent[] = [];
  let sent = false;

  try {
    const email = buildMissingServiceEmail(targetSunday, deadline);
    await sendTrackedEmail({
      to: pwRecipients,
      subject: `Action needed: no service section for ${formattedDate} — songs ${deadline.subjectTail}`,
      body: email.text,
      html: email.html,
      history: {
        runId: options.runId,
        module: 'pw',
        kind: 'pw_admin_missing_service',
        trigger: options.trigger,
        targetSunday,
        payload: { reason: 'no_dated_heading_in_week' },
      },
    });
    for (const recipient of pwRecipients) {
      emailsSent.push({
        to: recipient,
        type: 'admin_missing_service',
        sectionName: '—',
        sentAt: new Date().toISOString(),
      });
    }
    log(`Missing service section email sent to ${pwRecipients.join(', ')} for ${targetSunday}`, 'validator');
    sent = true;
  } catch (err: any) {
    log(`Failed to send missing service section email: ${err.message}`, 'validator');
  }

  if (sent) {
    try {
      const groupEmails = pwRecipients.filter((e) => e !== adminEmail);
      const groupPhones = await getPhonesForEmails(groupEmails);
      const adminPhone = getAdminPhone();
      const allPhones = [...new Set([...groupPhones, ...(adminPhone ? [adminPhone] : [])])];
      if (allPhones.length > 0) {
        await sendTrackedSms({
          to: allPhones,
          body: `[MD Bot] ${deadline.countdown}: the setlist document has no service section for ${formattedDate}, so nobody is being reminded. Check your email for more details.`,
          module: 'pw',
          trigger: options.trigger,
          runId: options.runId,
        });
      }
    } catch (err: any) {
      log(`Failed to send missing service section SMS: ${err.message}`, 'validator');
    }
  }

  return emailsSent;
}

export async function sendValidationEmails(
  validations: SectionValidation[],
  weekData: WeekData,
  options: {
    runId: string;
    trigger: EmailTrigger;
    targetSunday: string;
    deadline: DeadlineContext;
  }
): Promise<EmailSent[]> {
  const adminEmail = getAdminEmail();
  const pwRecipients = getPraiseAndWorshipEmails();
  const emailsSent: EmailSent[] = [];
  const deadline = options.deadline;

  for (const v of validations) {
    if (v.status === 'complete') continue;

    if (v.status === 'missing_leader') {
      let missingLeaderEmailSent = false;
      if (pwRecipients.length === 0) {
        log(`No recipients configured — skipping missing leader notification for ${v.sectionName}`, 'validator');
      } else try {
        const email = buildAdminEmail(v.sectionName, deadline);
        const subject = `Action needed: no leader for ${v.sectionName} — songs ${deadline.subjectTail}`;
        await sendTrackedEmail({
          to: pwRecipients,
          subject,
          body: email.text,
          html: email.html,
          history: {
            runId: options.runId,
            module: 'pw',
            kind: 'pw_admin_missing_leader',
            trigger: options.trigger,
            targetSunday: options.targetSunday,
            payload: {
              serviceDate: weekData.serviceDate,
              rawHeader: weekData.rawHeader,
              sectionName: v.sectionName,
              leaderEmail: v.leaderEmail,
              status: v.status,
              songCount: v.songCount,
              songsWithLinks: v.songsWithLinks,
              songsWithoutLinks: v.songsWithoutLinks,
            },
          },
        });
        for (const recipient of pwRecipients) {
          emailsSent.push({
            to: recipient,
            type: 'admin_missing_leader',
            sectionName: v.sectionName,
            sentAt: new Date().toISOString(),
          });
        }
        log(`Missing leader email sent to ${pwRecipients.join(', ')} for ${v.sectionName}`, 'validator');
        missingLeaderEmailSent = true;
      } catch (err: any) {
        log(`Failed to send missing leader email for ${v.sectionName}: ${err.message}`, 'validator');
      }

      if (missingLeaderEmailSent) {
        try {
          const groupEmails = pwRecipients.filter(e => e !== adminEmail);
          const groupPhones = await getPhonesForEmails(groupEmails);
          const adminPhone = getAdminPhone();
          const allPhones = [...new Set([...groupPhones, ...(adminPhone ? [adminPhone] : [])])];
          if (allPhones.length > 0) {
            await sendTrackedSms({
              to: allPhones,
              body: `[MD Bot] Action needed: ${v.sectionName} has no leader and songs are ${deadline.subjectTail}. Check your email for more details.`,
              module: 'pw',
              trigger: options.trigger,
              runId: options.runId,
            });
          }
        } catch (err: any) {
          log(`Failed to send missing leader SMS for ${v.sectionName}: ${err.message}`, 'validator');
        }
      }
      continue;
    }

    if (v.leaderEmail && (v.status === 'missing_songs' || v.status === 'missing_links')) {
      let leaderEmailSent = false;
      try {
        const email = buildLeaderEmail(v, deadline);
        const subject = `${deadline.countdown} — ${v.sectionName} songs ${deadline.subjectTail}`;
        await sendTrackedEmail({
          to: v.leaderEmail,
          subject,
          body: email.text,
          html: email.html,
          history: {
            runId: options.runId,
            module: 'pw',
            kind: 'pw_leader_reminder',
            trigger: options.trigger,
            targetSunday: options.targetSunday,
            payload: {
              serviceDate: weekData.serviceDate,
              rawHeader: weekData.rawHeader,
              sectionName: v.sectionName,
              leaderEmail: v.leaderEmail,
              status: v.status,
              songCount: v.songCount,
              songsWithLinks: v.songsWithLinks,
              songsWithoutLinks: v.songsWithoutLinks,
            },
          },
        });
        emailsSent.push({
          to: v.leaderEmail,
          type: 'leader_reminder',
          sectionName: v.sectionName,
          sentAt: new Date().toISOString(),
        });
        log(`Reminder sent to ${v.leaderEmail} for ${v.sectionName}`, 'validator');
        leaderEmailSent = true;
      } catch (err: any) {
        log(`Failed to send reminder email to ${v.leaderEmail}: ${err.message}`, 'validator');
      }

      if (leaderEmailSent) {
        try {
          const leaderPhone = await getPhoneForEmail(v.leaderEmail);
          if (leaderPhone) {
            await sendTrackedSms({
              to: leaderPhone,
              body: `[MD Bot] ${deadline.countdown}: your ${v.sectionName} setlist is ${deadline.subjectTail}. Check your email for more details.`,
              module: 'pw',
              trigger: options.trigger,
              runId: options.runId,
            });
          }
        } catch (err: any) {
          log(`Failed to send reminder SMS to ${v.leaderEmail}: ${err.message}`, 'validator');
        }
      }
    }
  }

  return emailsSent;
}
