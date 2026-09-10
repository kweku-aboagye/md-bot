import cron from 'node-cron';
import { getAdminEmail, getEmailRoutingConfig } from '../config/resources';
import type { PrepCycle, ScheduleInfo } from '../http/types';
import { log } from '../logging/log';
import { runCelestialCheck } from '../../modules/celestial/service';
import { runHghReport } from '../../modules/hgh-gap/service';
import { checkHGHSelectionAndNotify } from '../../modules/hgh-selection/service';
import { runValidation } from '../../modules/pw/service';
import { runZamarPrep } from '../../modules/zamar/service';
import {
  addWeeks,
  CT_OFFSET_HOURS,
  daysUntilDeadline,
  formatISODate,
  getMusicDeadline,
  getTargetSunday,
  getTeamRehearsal,
  isPastDeadline,
} from './target-sunday';

const CT_9AM_UTC = 9 + CT_OFFSET_HOURS;
const CT_NOON_UTC = 12 + CT_OFFSET_HOURS;
const CT_5PM_UTC = 17 + CT_OFFSET_HOURS;

function toCtComponents(utcDate: Date) {
  const ctMs = utcDate.getTime() - CT_OFFSET_HOURS * 60 * 60 * 1000;
  const ctDate = new Date(ctMs);

  return {
    year: ctDate.getUTCFullYear(),
    month: ctDate.getUTCMonth(),
    day: ctDate.getUTCDate(),
    weekday: ctDate.getUTCDay(),
    hour: ctDate.getUTCHours(),
  };
}

function ctComponentsToUtc(year: number, month: number, day: number, hour: number): Date {
  return new Date(Date.UTC(year, month, day, hour + CT_OFFSET_HOURS, 0, 0, 0));
}

function toPrepCycle(sunday: Date): PrepCycle {
  return {
    sunday: formatISODate(sunday),
    deadline: getMusicDeadline(sunday).toISOString(),
    teamRehearsal: formatISODate(getTeamRehearsal(sunday)),
  };
}

export function getNextScheduledRun(): ScheduleInfo {
  const now = new Date();
  const ct = toCtComponents(now);

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

  const nextRunUtc = ctComponentsToUtc(ct.year, ct.month, ct.day + daysAhead, nextHourCT);
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
    `0 ${CT_9AM_UTC},${CT_5PM_UTC} * * 1-6`,
    whileCollecting('P&W scheduled validation', () => runValidation('scheduled'))
  );

  cron.schedule(
    `0 ${CT_9AM_UTC},${CT_5PM_UTC} * * 1-6`,
    whileCollecting('Celestial hymn check', () => runCelestialCheck('scheduled'))
  );

  cron.schedule(`0 ${CT_9AM_UTC} * * 1`, async () => {
    log('HGH gap report triggered (Monday)', 'scheduler');
    try {
      await runHghReport('scheduled');
    } catch (err: any) {
      log(`HGH gap report error: ${err.message}`, 'scheduler');
    }
  });

  cron.schedule(
    `0 ${CT_9AM_UTC},${CT_5PM_UTC} * * 1-6`,
    whileCollecting('HGH selection check', () => checkHGHSelectionAndNotify('scheduled'))
  );

  cron.schedule(`0 ${CT_NOON_UTC} * * 3`, async () => {
    log('Zamar prep list triggered (Wednesday)', 'scheduler');
    try {
      await runZamarPrep('scheduled');
    } catch (err: any) {
      log(`Zamar prep error: ${err.message}`, 'scheduler');
    }
  });

  log(
    'Scheduler started: P&W+Celestial+HGH-Selection Mon-Sat 9AM/5PM CT until the Wed 12PM CT deadline | HGH Gap Mon 9AM CT | Zamar Wed 12PM CT',
    'scheduler'
  );
}
