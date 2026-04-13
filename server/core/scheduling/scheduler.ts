import cron from 'node-cron';
import { getAdminEmail, getEmailRoutingConfig } from '../config/resources';
import type { ScheduleInfo } from '../http/types';
import { log } from '../logging/log';
import { runCelestialCheck } from '../../modules/celestial/service';
import { runHghReport } from '../../modules/hgh-gap/service';
import { checkHGHSelectionAndNotify } from '../../modules/hgh-selection/service';
import { runValidation } from '../../modules/pw/service';
import { runZamarPrep } from '../../modules/zamar/service';
import { formatISODate, getTargetSunday } from './target-sunday';

const CT_OFFSET_HOURS = 5;
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
  const targetSunday = getTargetSunday(nextRunUtc);

  return {
    adminEmail: getAdminEmail(),
    nextRunAt: nextRunUtc.toISOString(),
    targetSunday: formatISODate(targetSunday),
    emailRouting: getEmailRoutingConfig(),
  };
}

export async function startScheduler() {
  if (process.env.NODE_ENV !== 'production') {
    log('Scheduler disabled in dev mode — use manual API routes to trigger runs', 'scheduler');
    return;
  }

  cron.schedule(`0 ${CT_9AM_UTC},${CT_5PM_UTC} * * 1-6`, async () => {
    log('P&W scheduled validation triggered', 'scheduler');
    try {
      await runValidation('scheduled');
    } catch (err: any) {
      log(`P&W scheduled error: ${err.message}`, 'scheduler');
    }
  });

  cron.schedule(`0 ${CT_9AM_UTC},${CT_5PM_UTC} * * 1-6`, async () => {
    log('Celestial hymn check triggered', 'scheduler');
    try {
      await runCelestialCheck('scheduled');
    } catch (err: any) {
      log(`Celestial check error: ${err.message}`, 'scheduler');
    }
  });

  cron.schedule(`0 ${CT_9AM_UTC} * * 1`, async () => {
    log('HGH gap report triggered (Monday)', 'scheduler');
    try {
      await runHghReport('scheduled');
    } catch (err: any) {
      log(`HGH gap report error: ${err.message}`, 'scheduler');
    }
  });

  cron.schedule(`0 ${CT_9AM_UTC},${CT_5PM_UTC} * * 1-6`, async () => {
    log('HGH selection check triggered', 'scheduler');
    try {
      await checkHGHSelectionAndNotify('scheduled');
    } catch (err: any) {
      log(`HGH selection check error: ${err.message}`, 'scheduler');
    }
  });

  cron.schedule(`0 ${CT_NOON_UTC} * * 3`, async () => {
    log('Zamar prep list triggered (Wednesday)', 'scheduler');
    try {
      await runZamarPrep('scheduled');
    } catch (err: any) {
      log(`Zamar prep error: ${err.message}`, 'scheduler');
    }
  });

  log(
    'Scheduler started: P&W+Celestial+HGH-Selection Mon-Sat 9AM/5PM CT | HGH Gap Mon 9AM CT | Zamar Wed 12PM CT',
    'scheduler'
  );
}
