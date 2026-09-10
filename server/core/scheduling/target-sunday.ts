// Hours to subtract from UTC to get the codebase's fixed local time (UTC−5).
// Central Time is UTC−6 during CST (Nov–Mar) and UTC−5 during CDT (Mar–Nov).
// This codebase runs on a fixed UTC−5 schedule and does not adjust for DST.
export const CT_OFFSET_HOURS = 5; // positive; subtract from UTC
const CT_OFFSET_MS = CT_OFFSET_HOURS * 60 * 60 * 1000;

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

export function getTargetSunday(fromDate: Date = new Date()): Date {
  const ct = new Date(fromDate.getTime() - CT_OFFSET_MS);
  // Days since the Thursday this collecting window opened (0 on Thursday).
  const sinceOpen = (ct.getUTCDay() - WINDOW_OPENS_DAY + 7) % 7;
  ct.setUTCDate(ct.getUTCDate() + WINDOW_OPENS_DAYS_BEFORE_SERVICE - sinceOpen);
  ct.setUTCHours(0, 0, 0, 0);
  return new Date(ct.getTime() + CT_OFFSET_MS);
}

export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// The Wednesday 12 PM CT band rehearsal at which this Sunday's music locks.
// After it, nothing a leader adds reaches the band, so nothing more is asked.
export function getMusicDeadline(targetSunday: Date = getTargetSunday()): Date {
  const ct = new Date(targetSunday.getTime() - CT_OFFSET_MS);
  ct.setUTCDate(ct.getUTCDate() - DEADLINE_DAYS_BEFORE_SERVICE);
  ct.setUTCHours(DEADLINE_HOUR_CT, 0, 0, 0);
  return new Date(ct.getTime() + CT_OFFSET_MS);
}

// The Sunday the team rehearses this service's set, a week before the service.
export function getTeamRehearsal(targetSunday: Date = getTargetSunday()): Date {
  const rehearsal = new Date(targetSunday);
  rehearsal.setUTCDate(rehearsal.getUTCDate() - TEAM_REHEARSAL_DAYS_BEFORE_SERVICE);
  return rehearsal;
}

export function addWeeks(sunday: Date, weeks: number): Date {
  const shifted = new Date(sunday);
  shifted.setUTCDate(shifted.getUTCDate() + weeks * 7);
  return shifted;
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
  return formatISODate(new Date(date.getTime() - CT_OFFSET_MS));
}
