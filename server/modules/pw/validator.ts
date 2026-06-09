import { getAdminEmail, getPraiseAndWorshipEmails } from '../../core/config/resources';
import type { EmailTrigger } from '../../core/email/history';
import { sendTrackedEmail } from '../../core/email/mailer';
import { formatEmailDate } from '../../core/email/reminder-template';
import { log } from '../../core/logging/log';
import { getPhoneForEmail, getPhonesForEmails } from '../../core/sms/contacts';
import { getAdminPhone, sendTrackedSms } from '../../core/sms/texter';
import { buildAdminEmail, buildLeaderEmail } from './email';
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

export async function sendValidationEmails(
  validations: SectionValidation[],
  weekData: WeekData,
  options: {
    runId: string;
    trigger: EmailTrigger;
    targetSunday: string;
  }
): Promise<EmailSent[]> {
  const adminEmail = getAdminEmail();
  const pwRecipients = getPraiseAndWorshipEmails();
  const emailsSent: EmailSent[] = [];
  const formattedDate = formatEmailDate(weekData.serviceDate);

  for (const v of validations) {
    if (v.status === 'complete') continue;

    if (v.status === 'missing_leader') {
      let missingLeaderEmailSent = false;
      if (pwRecipients.length === 0) {
        log(`No recipients configured — skipping missing leader notification for ${v.sectionName}`, 'validator');
      } else try {
        const email = buildAdminEmail(v.sectionName, formattedDate);
        const subject = `Action Needed: Missing Leader for ${v.sectionName} - ${formattedDate}`;
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
              body: `🤖 Action needed: ${v.sectionName} is missing a leader for Sunday (${formattedDate}). Check your email for more details.`,
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
        const email = buildLeaderEmail(v, formattedDate);
        const subject = `Reminder: Please Update Your ${v.sectionName} Setlist - ${formattedDate}`;
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
              body: `🤖 Reminder: your ${v.sectionName} setlist for Sunday (${formattedDate}) needs updating. Check your email for more details.`,
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
