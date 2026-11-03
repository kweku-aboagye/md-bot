// MD Bot's clock is the church's wall clock in Texas. Every "9 AM" or
// "Wednesday noon" in this codebase means 9 AM / noon in America/Chicago,
// whatever the season — CST (UTC−6) from November to March, CDT (UTC−5) the
// rest of the year. Offsets are never hardcoded: they are looked up from the
// IANA timezone database for the instant in question, so DST changes are
// handled automatically and the intended local times never drift.
export const CENTRAL_TZ = 'America/Chicago';

export interface CentralParts {
  year: number;
  month: number;   // 0-11, like Date#getUTCMonth
  day: number;
  weekday: number; // 0 = Sunday
  hour: number;
  minute: number;
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CENTRAL_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
});

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// The Central wall-clock reading of an instant.
export function toCentralParts(date: Date): CentralParts {
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    partsFormatter.formatToParts(date).find((p) => p.type === type)!.value;
  return {
    year: Number(get('year')),
    month: Number(get('month')) - 1,
    day: Number(get('day')),
    weekday: WEEKDAYS.indexOf(get('weekday')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

// The instant at which Central clocks read the given wall-clock time. Day and
// month overflow is normalised like Date.UTC (day 32 rolls into next month).
export function centralToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date {
  const wallAsUtc = Date.UTC(year, month, day, hour, minute);
  // Guess with the offset in force at that wall time, then correct once with
  // the offset at the guessed instant — this settles even across a DST change.
  let instant = wallAsUtc + offsetMs(new Date(wallAsUtc));
  instant = wallAsUtc + offsetMs(new Date(instant));
  return new Date(instant);
}

// How far Central lags UTC at this instant (5h in CDT, 6h in CST), in ms.
function offsetMs(date: Date): number {
  const p = toCentralParts(date);
  const wallAsUtc = Date.UTC(p.year, p.month, p.day, p.hour, p.minute);
  const truncated = Math.floor(date.getTime() / 60000) * 60000;
  return truncated - wallAsUtc;
}

// The Central calendar date an instant falls on, as yyyy-mm-dd.
export function formatCentralDate(date: Date): string {
  const p = toCentralParts(date);
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
