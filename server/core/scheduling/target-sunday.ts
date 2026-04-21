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

// Returns the ISO date of the First Friday of fromDate's calendar month (UTC),
// but only when that Friday falls strictly after fromDate and on or before
// targetSunday — i.e. it's within the current prep window. Otherwise null.
export function getUpcomingHalfNight(
  fromDate: Date = new Date(),
  targetSunday: Date = getTargetSunday()
): string | null {
  const year = fromDate.getUTCFullYear();
  const month = fromDate.getUTCMonth();

  // Find first Friday of this month
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const dayOfWeek = firstOfMonth.getUTCDay(); // 0 = Sun, 5 = Fri
  const daysToFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - (dayOfWeek - 5);
  const firstFriday = new Date(Date.UTC(year, month, 1 + daysToFriday));

  const isAfterToday = firstFriday.getTime() > fromDate.getTime();
  const isBeforeOrOnTargetSunday = firstFriday.getTime() <= targetSunday.getTime();

  if (isAfterToday && isBeforeOrOnTargetSunday) {
    return formatISODate(firstFriday);
  }
  return null;
}
