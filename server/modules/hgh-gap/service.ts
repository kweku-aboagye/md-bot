import { getAdminEmail } from '../../core/config/resources';
import { createRunId } from '../../core/email/history';
import { sendTrackedEmail } from '../../core/email/mailer';
import { log } from '../../core/logging/log';
import { getAdminPhone, sendTrackedSms } from '../../core/sms/texter';
import { buildHghGapReportEmail } from './email';
import { runHghGapFinder } from './finder';

export { runHghGapFinder };

export async function runHghReport(trigger: 'scheduled' | 'manual' = 'manual') {
  const runId = createRunId();
  const adminEmail = getAdminEmail();
  log(`Running HGH gap report (trigger: ${trigger})`, 'hgh-gap');
  const result = await runHghGapFinder();

  if (!adminEmail) {
    log('No ADMIN_EMAIL configured — skipping HGH gap report email', 'hgh-gap');
    return result;
  }

  const email = buildHghGapReportEmail(result);

  await sendTrackedEmail({
    to: adminEmail,
    subject: `His Glory Heralds Gap Report — ${result.unministeredSongs.length} songs remaining in playlist`,
    body: email.text,
    html: email.html,
    history: {
      runId,
      module: 'hgh-gap',
      kind: 'hgh_gap_report',
      trigger,
      payload: {
        totalPlaylistSongs: result.totalPlaylistSongs,
        ministeredTitles: result.ministeredTitles,
        unministeredSongs: result.unministeredSongs,
        suggestedNext: result.suggestedNext,
      },
    },
  });

  log(`HGH gap report sent to ${adminEmail}`, 'hgh-gap');

  const adminPhone = getAdminPhone();
  if (adminPhone) {
    await sendTrackedSms({
      to: adminPhone,
      body: `🤖 His Glory Heralds gap report is ready — ${result.unministeredSongs.length} songs remaining. Check your email for more details.`,
      module: 'hgh-gap',
      trigger,
      runId,
    });
  }

  return result;
}
