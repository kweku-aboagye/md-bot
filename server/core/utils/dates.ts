/**
 * utils/dates.ts
 *
 * Shared date utilities for the reminder modules.
 */

/**
 * Parse a sheet date cell (handles M/D/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * and return an ISO date string (yyyy-mm-dd), or null if unrecognised.
 *
 * This handles the Celestial and HGH sheets which store dates as M/D/YYYY
 * without leading zeros (e.g. "1/5/2026" not "01/05/2026").
 */
export function parseCellDateToISO(raw: string): string | null {
  // M/D/YYYY or MM/DD/YYYY
  const slashMatch = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10);
    const day   = parseInt(slashMatch[2], 10);
    const year  = parseInt(slashMatch[3], 10);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  // YYYY-MM-DD (ISO — also returned by Google Sheets in some locales)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
  return null;
}
