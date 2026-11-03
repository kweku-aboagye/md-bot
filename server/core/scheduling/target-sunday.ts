import { centralToUtc, formatCentralDate, toCentralParts } from './central-time';

// All times here are Central wall-clock times (America/Chicago), DST-aware —
// see central-time.ts. A "Sunday" is the instant of midnight Central on that
// day. Midnight Central is always 05:00 or 06:00 UTC, so a Sunday's UTC
// calendar date is its Central calendar date, which is what calendarDate reads.

// The music for a service is due at the Zamar band rehearsal, which is always
// the Wednesday 11 days before it: the band rehearses on the 9th for the 20th,
// the team then rehearses that set on the 13th, and it is sung on the 20th.
export const DEADLINE_DAYS_BEFORE_SERVICE = 11;
export const DEADLINE_HOUR_CT = 12;
const TEAM_REHEARSAL_DAYS_BEFORE_SERVICE = 7;

// One Sunday is collected for at a time, and the window runs Thursday→Wednesday:
// it opens the morning after one Sunday's music locks and closes when the next
// one does. That places the whole of Wednesday inside the window it belongs to,
// so the noon Zamar run always compiles the Sunday whose deadline it is — no
// dependence on whether the roll happens before or after the cron fires.
const WINDOW_OPENS_DAY = 4;                          // Thursday
const WINDOW_OPENS_DAYS_BEFORE_SERVICE = 17;

function calendarDate(day: Date) {
  return { year: day.getUTCFullYear(), month: day.getUTCMonth(), day: day.getUTCDate() };
}

// Midnight Central `days` calendar days after `day` — DST-safe, unlike adding
// a fixed 24h per day.
function shiftDays(day: Date, days: number, hour = 0): Date {
  const d = calendarDate(day);
  return centralToUtc(d.year, d.month, d.day + days, hour);
}

export function getTargetSunday(fromDate: Date = new Date()): Date {
  const ct = toCentralParts(fromDate);
  // Days since the Thursday this collecting window opened (0 on Thursday).
  const sinceOpen = (ct.weekday - WINDOW_OPENS_DAY + 7) % 7;
  return centralToUtc(ct.year, ct.month, ct.day + WINDOW_OPENS_DAYS_BEFORE_SERVICE - sinceOpen);
}

export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// The Wednesday 12 PM CT band rehearsal at which this Sunday's music locks.
// After it, nothing a leader adds reaches the band, so nothing more is asked.
export function getMusicDeadline(targetSunday: Date = getTargetSunday()): Date {
  return shiftDays(targetSunday, -DEADLINE_DAYS_BEFORE_SERVICE, DEADLINE_HOUR_CT);
}

// The Sunday the team rehearses this service's set, a week before the service.
export function getTeamRehearsal(targetSunday: Date = getTargetSunday()): Date {
  return shiftDays(targetSunday, -TEAM_REHEARSAL_DAYS_BEFORE_SERVICE);
}

export function addWeeks(sunday: Date, weeks: number): Date {
  return shiftDays(sunday, weeks * 7);
}

export function isPastDeadline(
  from: Date = new Date(),
  targetSunday: Date = getTargetSunday(from)
): boolean {
  return from.getTime() >= getMusicDeadline(targetSunday).getTime();
}

// Whole CT calendar days from `from` to the deadline — the unit the reminders
// count in, so every email sent on a given day says the same number of days
// left regardless of whether it went out at 9 AM or 5 PM. Negative once passed.
export function daysUntilDeadline(
  from: Date = new Date(),
  targetSunday: Date = getTargetSunday(from)
): number {
  const deadlineDay = Date.parse(formatCtDate(getMusicDeadline(targetSunday)));
  const fromDay = Date.parse(formatCtDate(from));
  return Math.round((deadlineDay - fromDay) / (24 * 60 * 60 * 1000));
}

// The Monday→Sunday window leading up to (and including) the target Sunday —
// the same range the P&W document reader uses to decide which dated services
// belong to a given week. Returned as inclusive ISO date bounds so any module
// can filter its own dated entries down to that week.
export function getWeekWindow(
  targetSunday: Date = getTargetSunday()
): { start: string; end: string } {
  const sunday = new Date(Date.UTC(
    targetSunday.getUTCFullYear(),
    targetSunday.getUTCMonth(),
    targetSunday.getUTCDate()
  ));
  const monday = new Date(sunday);
  monday.setUTCDate(sunday.getUTCDate() - 6);
  return { start: formatISODate(monday), end: formatISODate(sunday) };
}

// The CT calendar date an instant falls on, as an ISO date string. Comparing
// window bounds in CT rather than UTC keeps a date "current" until midnight CT.
export function formatCtDate(date: Date): string {
  return formatCentralDate(date);
}
