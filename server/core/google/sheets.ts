import { getSheetsClient } from './auth';

// ── YouTube ID extraction ─────────────────────────────────────────────────────

function extractYouTubeVideoId(url: string): string | null {
  // Handles:
  //   https://www.youtube.com/watch?v=VIDEO_ID
  //   https://www.youtube.com/watch?v=VIDEO_ID&list=...
  //   https://youtu.be/VIDEO_ID
  const match = url.match(
    /(?:youtube\.com\/watch\?(?:[^&]*&)*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function extractRichTextLinkUrl(cell: any): string | null {
  const textRuns = cell?.textFormatRuns ?? [];

  for (const run of textRuns) {
    const uri = run?.format?.link?.uri;
    if (uri) return uri;
  }

  return null;
}

function extractChipRunUrl(cell: any): string | null {
  const chipRuns = cell?.chipRuns ?? [];

  for (const run of chipRuns) {
    const uri = run?.chip?.richLinkProperties?.uri;
    if (uri) return uri;
  }

  return null;
}

function extractFormulaLinkUrl(cell: any): string | null {
  const formula = cell?.userEnteredValue?.formulaValue ?? '';
  const match = formula.match(/https?:\/\/[^"]+/i);
  return match ? match[0] : null;
}

function extractCellUrl(cell: any): string | null {
  const rawString = cell?.userEnteredValue?.stringValue ?? '';

  return (
    cell?.hyperlink
    ?? extractRichTextLinkUrl(cell)
    ?? extractChipRunUrl(cell)
    ?? extractFormulaLinkUrl(cell)
    ?? ((rawString.includes('youtube.com') || rawString.includes('youtu.be') || rawString.startsWith('http')) ? rawString : null)
  );
}

// ── Cell link reader ──────────────────────────────────────────────────────────

export interface CellLink {
  displayText: string;       // The text shown in the cell (song name or video title)
  youtubeVideoId: string | null;  // Extracted from hyperlink or chip URL
}

export interface CellLinkDetail {
  displayText: string;
  url: string | null;
  youtubeVideoId: string | null;
}

function hasMeaningfulCellData(cell: any): boolean {
  if (!cell) return false;

  if (cell.formattedValue) return true;
  if (cell.hyperlink) return true;

  const entered = cell.userEnteredValue;
  if (entered?.stringValue) return true;
  if (entered?.formulaValue) return true;
  if (typeof entered?.numberValue === 'number') return true;
  if (typeof entered?.boolValue === 'boolean') return true;

  const effective = cell.effectiveValue;
  if (effective?.stringValue) return true;
  if (typeof effective?.numberValue === 'number') return true;
  if (typeof effective?.boolValue === 'boolean') return true;

  const textRuns = cell.textFormatRuns ?? [];
  if (textRuns.some((run: any) => run?.format?.link?.uri)) return true;

  return false;
}

/**
 * Reads a single column from a sheet tab using the full cell metadata API
 * (spreadsheets.get with includeGridData: true) so we can see both:
 *
 *   - cell.hyperlink      → set for inserted-link cells (text + attached URL)
 *   - cell.userEnteredValue.stringValue → the raw URL for YouTube chip cells
 *   - cell.textFormatRuns[].format.link.uri → rich-text links on cell text
 *
 * This is the only reliable way to get YouTube video IDs out of cells because
 * Sheets stores links in multiple shapes depending on how the cell was edited.
 */
export async function readColumnLinks(
  spreadsheetId: string,
  tabName: string,
  column: string,   // e.g. 'A'
  startRow: number
): Promise<CellLink[]> {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [`'${tabName}'!${column}${startRow}:${column}`],
    includeGridData: true,
  });

  const results: CellLink[] = [];
  const dataBlocks = response.data.sheets?.[0]?.data ?? [];

  for (const block of dataBlocks) {
    const rowData = block.rowData ?? [];

    for (const row of rowData) {
      const cell = row.values?.[0];
      if (!cell || !hasMeaningfulCellData(cell)) continue;

      const displayText = cell.formattedValue ?? '';
      let videoId: string | null = null;

      const cellUrl = extractCellUrl(cell);
      if (cellUrl) {
        videoId = extractYouTubeVideoId(cellUrl);
      }

      results.push({ displayText, youtubeVideoId: videoId });
    }
  }

  return results;
}

export async function readCellLink(
  spreadsheetId: string,
  tabName: string,
  column: string,
  rowNumber: number
): Promise<CellLinkDetail> {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [`'${tabName}'!${column}${rowNumber}`],
    includeGridData: true,
  });

  const cell = response.data.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values?.[0];
  if (!cell) {
    return { displayText: '', url: null, youtubeVideoId: null };
  }

  const displayText = cell.formattedValue ?? '';
  const url = extractCellUrl(cell);

  return {
    displayText,
    url,
    youtubeVideoId: url ? extractYouTubeVideoId(url) : null,
  };
}

/**
 * Read all rows from a specific tab in a Google Sheet.
 * Returns rows as string[][] (empty cells are empty strings).
 */
export async function readSheetTab(
  spreadsheetId: string,
  tabName: string,
  startRow = 1
): Promise<string[][]> {
  const sheets = await getSheetsClient();

  const range = `'${tabName}'!A${startRow}:Z`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'FORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  const rows = response.data.values || [];

  // Normalize: ensure every row has the same length (pad with empty strings)
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) => {
    const padded = [...row];
    while (padded.length < maxCols) padded.push('');
    return padded;
  });
}

/**
 * Alias used by sheetChecker.ts — reads all rows from a tab (from row 1).
 */
export async function getSheetRows(
  sheetId: string,
  tabName: string
): Promise<string[][]> {
  return readSheetTab(sheetId, tabName, 1);
}
