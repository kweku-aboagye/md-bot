export function getTargetSunday(fromDate: Date = new Date()): Date {
  const day = fromDate.getUTCDay();
  const daysUntilNextSunday = day === 0 ? 14 : (7 - day) + 7;

  const target = new Date(fromDate);
  target.setUTCDate(target.getUTCDate() + daysUntilNextSunday);
  target.setUTCHours(0, 0, 0, 0);
  return target;
}

export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Fixed UTC−5 offset used throughout the scheduling module.
// Central Time is UTC−6 during CST (Nov–Mar) and UTC−5 during CDT (Mar–Nov).
// This codebase runs on a fixed UTC−5 schedule and does not adjust for DST.
export const CT_OFFSET_HOURS = 5;
const CT_OFFSET_MS = CT_OFFSET_HOURS * 60 * 60 * 1000;

// Returns the ISO date of the First Friday of the month within the prep window
// (on or after fromDate, and on or before targetSunday), or null.
//
// Checks both fromDate's month and targetSunday's month because the window often
// crosses a month boundary (e.g. fromDate=Apr 21, targetSunday=May 3 → May 1).
// Both bounds are converted to CT calendar dates before comparison so the
// Half Night banner stays visible until midnight CT rather than midnight UTC.
export function getUpcomingHalfNight(
  fromDate: Date = new Date(),
  targetSunday: Date = getTargetSunday()
): string | null {
  const fromISO = formatISODate(new Date(fromDate.getTime() - CT_OFFSET_MS));
  const targetISO = formatISODate(new Date(targetSunday.getTime() - CT_OFFSET_MS));

  const fromCT = new Date(fromDate.getTime() - CT_OFFSET_MS);
  const monthsToCheck: Array<{ year: number; month: number }> = [
    { year: fromCT.getUTCFullYear(), month: fromCT.getUTCMonth() },
  ];
  const targetCT = new Date(targetSunday.getTime() - CT_OFFSET_MS);
  const tYear = targetCT.getUTCFullYear();
  const tMonth = targetCT.getUTCMonth();
  if (tYear !== monthsToCheck[0].year || tMonth !== monthsToCheck[0].month) {
    monthsToCheck.push({ year: tYear, month: tMonth });
  }

  for (const { year, month } of monthsToCheck) {
    const firstOfMonth = new Date(Date.UTC(year, month, 1));
    const dow = firstOfMonth.getUTCDay(); // 0 = Sun … 5 = Fri
    const daysToFriday = dow <= 5 ? 5 - dow : 7 - (dow - 5);
    const fridayISO = formatISODate(new Date(Date.UTC(year, month, 1 + daysToFriday)));

    if (fridayISO >= fromISO && fridayISO <= targetISO) {
      return fridayISO;
    }
  }

  return null;
}
