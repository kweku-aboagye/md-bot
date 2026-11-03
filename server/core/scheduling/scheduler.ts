import cron from 'node-cron';
import { getAdminEmail, getEmailRoutingConfig } from '../config/resources';
import type { PrepCycle, ScheduleInfo } from '../http/types';
import { log } from '../logging/log';
import { runCelestialCheck } from '../../modules/celestial/service';
import { runHghReport } from '../../modules/hgh-gap/service';
import { checkHGHSelectionAndNotify } from '../../modules/hgh-selection/service';
import { runValidation } from '../../modules/pw/service';
import { runZamarPrep } from '../../modules/zamar/service';
import { CENTRAL_TZ, centralToUtc, toCentralParts } from './central-time';
import {
  addWeeks,
  daysUntilDeadline,
  formatISODate,
  getMusicDeadline,
  getTargetSunday,
  getTeamRehearsal,
  isPastDeadline,
} from './target-sunday';

// Cron hours are Central wall-clock hours. Every job is registered with
// timezone: America/Chicago, so node-cron resolves them against the timezone
// database and they stay at 9 AM / noon / 5 PM local across DST changes.
const CT_9AM = 9;
const CT_NOON = 12;
const CT_5PM = 17;
const CRON_OPTIONS = { timezone: CENTRAL_TZ };

function toPrepCycle(sunday: Date): PrepCycle {
  return {
    sunday: formatISODate(sunday),
    deadline: getMusicDeadline(sunday).toISOString(),
    teamRehearsal: formatISODate(getTeamRehearsal(sunday)),
  };
}

export function getNextScheduledRun(): ScheduleInfo {
  const now = new Date();
  const ct = toCentralParts(now);

  let daysAhead = 0;
  let nextHourCT = 9;

  if (ct.weekday === 0) {
    daysAhead = 1;
    nextHourCT = 9;
  } else if (ct.weekday >= 1 && ct.weekday <= 6) {
    if (ct.hour >= 17) {
      daysAhead = ct.weekday === 6 ? 2 : 1;
      nextHourCT = 9;
    } else if (ct.hour >= 9) {
      nextHourCT = 17;
    } else {
      nextHourCT = 9;
    }
  }

  const nextRunUtc = centralToUtc(ct.year, ct.month, ct.day + daysAhead, nextHourCT);
  const targetSundayDate = getTargetSunday(now);

  // Between Wednesday noon and Thursday nothing is being collected: this
  // Sunday's music has locked and the next window has not opened yet. Otherwise
  // the Sunday in flight with the band is always the one a week behind.
  const locked = isPastDeadline(now, targetSundayDate);

  return {
    adminEmail: getAdminEmail(),
    nextRunAt: nextRunUtc.toISOString(),
    targetSunday: formatISODate(targetSundayDate),
    collecting: locked ? null : toPrepCycle(targetSundayDate),
    daysUntilDeadline: locked ? null : daysUntilDeadline(now, targetSundayDate),
    locked: toPrepCycle(locked ? targetSundayDate : addWeeks(targetSundayDate, -1)),
    emailRouting: getEmailRoutingConfig(),
  };
}

export async function startScheduler() {
  if (process.env.NODE_ENV !== 'production') {
    log('Scheduler disabled in dev mode — use manual API routes to trigger runs', 'scheduler');
    return;
  }

  // Once the band has rehearsed, nothing a leader adds reaches them, so the
  // reminders stop rather than chasing a set that is already final. In practice
  // this is the Wednesday 5 PM run: by Thursday the window has rolled to the
  // next Sunday and its own deadline is a week out. Manual /api/test/* triggers
  // are deliberately not gated — the MD can still force a send.
  const whileCollecting = (label: string, run: () => Promise<unknown>) => async () => {
    if (isPastDeadline()) {
      log(`${label} skipped — music deadline has passed for this Sunday`, 'scheduler');
      return;
    }
    log(`${label} triggered`, 'scheduler');
    try {
      await run();
    } catch (err: any) {
      log(`${label} error: ${err.message}`, 'scheduler');
    }
  };

  cron.schedule(
    `0 ${CT_9AM},${CT_5PM} * * 1-6`,
    whileCollecting('P&W scheduled validation', () => runValidation('scheduled')),
    CRON_OPTIONS
  );

  cron.schedule(
    `0 ${CT_9AM},${CT_5PM} * * 1-6`,
    whileCollecting('Celestial hymn check', () => runCelestialCheck('scheduled')),
    CRON_OPTIONS
  );

  cron.schedule(`0 ${CT_9AM} * * 1`, async () => {
    log('HGH gap report triggered (Monday)', 'scheduler');
    try {
      await runHghReport('scheduled');
    } catch (err: any) {
      log(`HGH gap report error: ${err.message}`, 'scheduler');
    }
  }, CRON_OPTIONS);

  cron.schedule(
    `0 ${CT_9AM},${CT_5PM} * * 1-6`,
    whileCollecting('HGH selection check', () => checkHGHSelectionAndNotify('scheduled')),
    CRON_OPTIONS
  );

  cron.schedule(`0 ${CT_NOON} * * 3`, async () => {
    log('Zamar prep list triggered (Wednesday)', 'scheduler');
    try {
      await runZamarPrep('scheduled');
    } catch (err: any) {
      log(`Zamar prep error: ${err.message}`, 'scheduler');
    }
  }, CRON_OPTIONS);

  log(
    'Scheduler started: P&W+Celestial+HGH-Selection Mon-Sat 9AM/5PM CT until the Wed 12PM CT deadline | HGH Gap Mon 9AM CT | Zamar Wed 12PM CT',
    'scheduler'
  );
}
