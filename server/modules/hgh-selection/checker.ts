/**
 * sheetChecker.ts
 *
 * Generic helper shared by hghSelection.ts (and any future modules that follow
 * the same pattern: read a sheet tab, find a row matching a target Sunday,
 * check that the song/link column is non-empty).
 *
 * celestialTracker.ts has its own more detailed logic and doesn't use this
 * helper — but the pattern is the same.
 */

import { getSheetRows } from '../../core/google/sheets';
import { parseCellDateToISO } from '../../core/utils/dates';

export interface SheetConfig {
  /** Google Sheets spreadsheet ID */
  sheetId: string;
  /** Tab/worksheet name (case-sensitive) */
  tabName: string;
  /** 0-based column index that holds the date */
  dateColumn: number;
  /** 0-based column index that holds the song title or link */
  songColumn: number;
}

/**
 * Returns true if the sheet has a non-empty song entry for the provided date.
 * Handles M/D/YYYY, MM/DD/YYYY, and YYYY-MM-DD date formats in the sheet.
 */
export async function isSheetEntryFilledForDate(
  config: SheetConfig,
  targetDate: Date
): Promise<boolean> {
  const rows = await getSheetRows(config.sheetId, config.tabName);
  const targetISO = targetDate.toISOString().split('T')[0];

  return rows.some((row) => {
    const rawDate = row[config.dateColumn]?.trim();
    if (!rawDate) return false;

    const cellISO = parseCellDateToISO(rawDate);
    if (cellISO !== targetISO) return false;

    const song = row[config.songColumn]?.trim();
    return !!song && song.length > 0;
  });
}

export interface DatedEntry {
  /** ISO date (yyyy-mm-dd) parsed from the sheet's date column. */
  date: string;
  /** True when the song column for this row is non-empty. */
  filled: boolean;
}

/**
 * Returns every row in the sheet that has a parseable date, paired with whether
 * its song column is filled. Reads the tab once so callers can pull out a whole
 * week's worth of dates without a request per date.
 */
export async function getDatedEntries(config: SheetConfig): Promise<DatedEntry[]> {
  const rows = await getSheetRows(config.sheetId, config.tabName);
  const entries: DatedEntry[] = [];

  for (const row of rows) {
    const rawDate = row[config.dateColumn]?.trim();
    if (!rawDate) continue;

    const cellISO = parseCellDateToISO(rawDate);
    if (!cellISO) continue;

    const song = row[config.songColumn]?.trim();
    entries.push({ date: cellISO, filled: !!song && song.length > 0 });
  }

  return entries;
}
