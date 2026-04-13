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
