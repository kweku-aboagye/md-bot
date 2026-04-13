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
