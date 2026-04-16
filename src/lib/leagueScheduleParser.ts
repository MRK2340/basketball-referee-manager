/**
 * leagueScheduleParser.ts
 * Smart parser for league schedule Excel files in the "grouped row" format.
 *
 * Detects patterns like:
 *   Row: [Date] [Time] [Ref1] [Ref2]   ← game night header
 *   Row:        [Time]                  ← additional game on same night
 *   Row:        [Time]                  ← additional game on same night
 *   (blank rows between game nights)
 *
 * Supports the Surf City / ABB referee schedule format.
 */
import * as XLSX from 'xlsx';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LeagueGameNight {
  date: string;            // YYYY-MM-DD
  times: string[];         // ["19:00", "20:00", "21:00"]
  ref1: string;            // First name / label from column C
  ref2: string;            // First name / label from column D
  isTournament: boolean;   // Whether this falls under "Tournament Dates"
}

export interface LeagueParseResult {
  leagueName: string;
  gameNights: LeagueGameNight[];
  refereeNames: string[];  // Unique referee names found
  errors: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert an Excel serial date number to YYYY-MM-DD. */
const excelSerialToDate = (serial: number): string => {
  // Excel's epoch is Jan 1, 1900 (with the Lotus 1-2-3 leap year bug)
  const utcDays = Math.floor(serial) - 25569;
  const d = new Date(utcDays * 86400 * 1000);
  return d.toISOString().slice(0, 10);
};

/** Convert an Excel time fraction or time object to HH:MM. */
const normalizeExcelTime = (val: unknown): string => {
  if (val == null) return '';

  // Already a string like "19:00"
  if (typeof val === 'string') {
    const m = val.match(/^(\d{1,2}):(\d{2})/);
    if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
    return '';
  }

  // Excel time fraction (0.0 – 1.0)
  if (typeof val === 'number' && val >= 0 && val < 1) {
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  // Date object (from openpyxl-style time parsing via SheetJS)
  if (val instanceof Date) {
    const h = val.getHours?.() ?? val.getUTCHours?.();
    const min = val.getMinutes?.() ?? val.getUTCMinutes?.();
    if (h != null && min != null) {
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
  }

  return '';
};

/** Convert an Excel date value to YYYY-MM-DD. Handles Date objects and serial numbers. */
const normalizeExcelDate = (val: unknown): string => {
  if (val == null) return '';

  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof val === 'number' && val > 40000) {
    return excelSerialToDate(val);
  }

  if (typeof val === 'string') {
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // Try MM/DD/YYYY
    const m = val.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    // Try parsing as Date
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  return '';
};

// ── Main Parser ──────────────────────────────────────────────────────────────

export const parseLeagueScheduleFile = async (file: File): Promise<LeagueParseResult> => {
  const errors: string[] = [];
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext !== 'xlsx' && ext !== 'xls') {
    errors.push(`Unsupported file type: .${ext}. Please upload an Excel file (.xlsx or .xls).`);
    return { leagueName: '', gameNights: [], refereeNames: [], errors };
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (e) {
    errors.push(`Failed to read file: ${(e as Error).message}`);
    return { leagueName: '', gameNights: [], refereeNames: [], errors };
  }

  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellNF: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    errors.push('No sheets found in the workbook.');
    return { leagueName: '', gameNights: [], refereeNames: [], errors };
  }

  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const maxRow = range.e.r;

  // Read all cells into a 2D array for easier processing
  const cells: unknown[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    const row: unknown[] = [];
    for (let c = 0; c <= Math.max(range.e.c, 8); c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      row.push(cell ? cell.v : null);
    }
    cells.push(row);
  }

  // ── Extract league name from first non-empty row
  let leagueName = '';
  for (const row of cells) {
    const firstVal = row[0];
    if (firstVal && typeof firstVal === 'string' && firstVal.trim().length > 3) {
      leagueName = firstVal.trim();
      break;
    }
  }

  // ── Parse game nights using the grouped row pattern
  const gameNights: LeagueGameNight[] = [];
  const refereeNamesSet = new Set<string>();
  let inTournamentSection = false;
  let currentNight: LeagueGameNight | null = null;

  for (let r = 0; r < cells.length; r++) {
    const row = cells[r];
    const colA = row[0]; // Date column
    const colB = row[1]; // Time column
    const colC = row[2]; // Ref #1
    const colD = row[3]; // Ref #2

    // Check for "Tournament Dates" marker
    const rowText = row.map(v => (typeof v === 'string' ? v : '')).join(' ').toLowerCase();
    if (rowText.includes('tournament date')) {
      inTournamentSection = true;
      continue;
    }

    // Skip header rows (look for "Date", "Ref #1", etc.)
    if (typeof colA === 'string' && colA.toLowerCase().trim() === 'date') continue;
    if (typeof colC === 'string' && colC.toLowerCase().includes('ref')) continue;

    const dateStr = normalizeExcelDate(colA);
    const timeStr = normalizeExcelTime(colB);

    if (dateStr) {
      // New game night starts — save previous if exists
      if (currentNight && currentNight.times.length > 0) {
        gameNights.push(currentNight);
      }

      const ref1 = typeof colC === 'string' ? colC.trim() : '';
      const ref2 = typeof colD === 'string' ? colD.trim() : '';
      if (ref1) refereeNamesSet.add(ref1);
      if (ref2) refereeNamesSet.add(ref2);

      currentNight = {
        date: dateStr,
        times: timeStr ? [timeStr] : [],
        ref1,
        ref2,
        isTournament: inTournamentSection,
      };
    } else if (timeStr && currentNight) {
      // Continuation row — add time to current night
      currentNight.times.push(timeStr);
    }
  }

  // Push the last night
  if (currentNight && currentNight.times.length > 0) {
    gameNights.push(currentNight);
  }

  if (gameNights.length === 0) {
    errors.push(
      'Could not detect any game nights in this file. Expected a format with dates in column A, times in column B, and referee names in columns C/D.',
    );
  }

  return {
    leagueName,
    gameNights,
    refereeNames: Array.from(refereeNamesSet).sort(),
    errors,
  };
};
