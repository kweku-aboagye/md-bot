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

// Returns the ISO date of the First Friday of the month within the prep window
// (on or after fromDate, and on or before targetSunday), or null.
//
// Checks both fromDate's month and targetSunday's month because the window often
// crosses a month boundary (e.g. fromDate=Apr 21, targetSunday=May 3 → May 1).
// Uses date-only (ISO string) comparison so the Friday itself is included even
// when fromDate has a later time on the same calendar day (Half Night is at 9 PM).
export function getUpcomingHalfNight(
  fromDate: Date = new Date(),
  targetSunday: Date = getTargetSunday()
): string | null {
  const fromISO = formatISODate(fromDate);
  const targetISO = formatISODate(targetSunday);

  const monthsToCheck: Array<{ year: number; month: number }> = [
    { year: fromDate.getUTCFullYear(), month: fromDate.getUTCMonth() },
  ];
  const tYear = targetSunday.getUTCFullYear();
  const tMonth = targetSunday.getUTCMonth();
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
