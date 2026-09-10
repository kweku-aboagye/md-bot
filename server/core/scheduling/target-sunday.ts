// Hours to subtract from UTC to get the codebase's fixed local time (UTC−5).
// Central Time is UTC−6 during CST (Nov–Mar) and UTC−5 during CDT (Mar–Nov).
// This codebase runs on a fixed UTC−5 schedule and does not adjust for DST.
export const CT_OFFSET_HOURS = 5; // positive; subtract from UTC
const CT_OFFSET_MS = CT_OFFSET_HOURS * 60 * 60 * 1000;

export function getTargetSunday(fromDate: Date = new Date()): Date {
  const ct = new Date(fromDate.getTime() - CT_OFFSET_MS);
  const day = ct.getUTCDay();
  const daysUntil = day === 0 ? 7 : (7 - day) + 7;
  ct.setUTCDate(ct.getUTCDate() + daysUntil);
  ct.setUTCHours(0, 0, 0, 0);
  return new Date(ct.getTime() + CT_OFFSET_MS);
}

export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
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
