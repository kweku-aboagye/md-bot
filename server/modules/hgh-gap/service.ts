import { getAdminEmail } from '../../core/config/resources';
import { createRunId } from '../../core/email/history';
import { sendTrackedEmail } from '../../core/email/mailer';
import { log } from '../../core/logging/log';
import { buildHghGapReportEmail } from './email';
import { runHghGapFinder } from './finder';

export { fetchMinisteredVideoIds, fetchPlaylistSongs } from './finder';
export { runHghGapFinder };

export async function runHghReport(trigger: 'scheduled' | 'manual' = 'manual') {
  const runId = createRunId();
  const adminEmail = getAdminEmail();
  log(`Running HGH gap report (trigger: ${trigger})`, 'hgh-gap');
  const result = await runHghGapFinder();
  const email = buildHghGapReportEmail(result);

  await sendTrackedEmail({
    to: adminEmail,
    subject: `HGH Gap Report — ${result.unministeredSongs.length} songs remaining in playlist`,
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
  return result;
}

export async function runHghGapTracker() {
  log('Running HGH gap tracker alias using the standard report flow', 'hgh-gap');
  return runHghReport('manual');
}
