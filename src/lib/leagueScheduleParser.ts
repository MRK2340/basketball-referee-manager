/**
 * leagueScheduleParser.ts
 * Smart parser for league schedule files (Excel and CSV).
 *
 * Supports three formats:
 * 1. GROUPED ROW (Excel) — date+refs on one row, times on subsequent rows
 * 2. FLAT TABLE (Excel/CSV) — standard columns: Date, Time, Ref1, Ref2, Home, Away, etc.
 * 3. CSV — comma-separated with auto-detection of grouped vs flat format
 *
 * Auto-detects which format the file uses and parses accordingly.
 */
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LeagueGameNight {
  date: string;            // YYYY-MM-DD
  times: string[];         // ["19:00", "20:00", "21:00"]
  ref1: string;            // First name / label from column C
  ref2: string;            // First name / label from column D
  isTournament: boolean;   // Whether this falls under "Tournament Dates"
}

export interface FlatGameRow {
  date: string;            // YYYY-MM-DD
  time: string;            // HH:MM
  ref1: string;
  ref2: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  division: string;
  fee: number;
}

export interface LeagueParseResult {
  leagueName: string;
  gameNights: LeagueGameNight[];
  flatGames: FlatGameRow[];   // populated for flat table format
  refereeNames: string[];     // unique referee names found
  format: 'grouped' | 'flat';
  errors: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert an Excel serial date number to YYYY-MM-DD. */
const excelSerialToDate = (serial: number): string => {
  const utcDays = Math.floor(serial) - 25569;
  const d = new Date(utcDays * 86400 * 1000);
  return d.toISOString().slice(0, 10);
};

/** Convert an Excel time fraction or time object to HH:MM. */
const normalizeExcelTime = (val: unknown): string => {
  if (val == null) return '';

  if (typeof val === 'string') {
    // "19:00" or "7:00 PM"
    const m24 = val.match(/^(\d{1,2}):(\d{2})/);
    if (m24) return `${m24[1].padStart(2, '0')}:${m24[2]}`;
    const ampm = val.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (ampm) {
      let h = parseInt(ampm[1], 10);
      const min = ampm[2];
      const p = ampm[3].toUpperCase();
      if (p === 'PM' && h < 12) h += 12;
      if (p === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${min}`;
    }
    return '';
  }

  if (typeof val === 'number' && val >= 0 && val < 1) {
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  if (val instanceof Date) {
    const h = val.getHours?.() ?? val.getUTCHours?.();
    const min = val.getMinutes?.() ?? val.getUTCMinutes?.();
    if (h != null && min != null) {
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
  }

  return '';
};

/** Convert an Excel date value to YYYY-MM-DD. */
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const m = val.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  return '';
};

// ── Column Aliases for Flat Table Detection ──────────────────────────────────

const FLAT_ALIASES: Record<string, string[]> = {
  date:     ['date', 'game date', 'game_date', 'gamedate', 'start date'],
  time:     ['time', 'game time', 'game_time', 'gametime', 'start time', 'start'],
  ref1:     ['ref 1', 'ref1', 'ref #1', 'referee 1', 'referee1', 'official 1', 'official1'],
  ref2:     ['ref 2', 'ref2', 'ref #2', 'referee 2', 'referee2', 'official 2', 'official2'],
  homeTeam: ['home', 'home team', 'home_team', 'hometeam', 'team 1', 'team1'],
  awayTeam: ['away', 'visitor', 'away team', 'away_team', 'awayteam', 'visiting', 'team 2', 'team2'],
  venue:    ['location', 'site', 'venue', 'facility', 'gym', 'arena', 'court location'],
  division: ['division', 'grade', 'age group', 'age_group', 'class', 'bracket'],
  fee:      ['fee', 'pay', 'amount', 'game fee', 'payment', 'rate'],
};

const resolveFlatKey = (header: string): string | null => {
  const h = header.toLowerCase().trim();
  for (const [key, aliases] of Object.entries(FLAT_ALIASES)) {
    if (aliases.includes(h)) return key;
  }
  return null;
};

const buildFlatColumnMap = (headers: string[]): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const header of headers) {
    const key = resolveFlatKey(header);
    if (key && !map[key]) map[key] = header;
  }
  return map;
};

// ── Format Detection ─────────────────────────────────────────────────────────

/** Determine if an Excel sheet uses the flat table format (has recognizable column headers). */
const detectFlatFormat = (cells: unknown[][]): { isFlat: boolean; headerRow: number; headers: string[] } => {
  // Check first 10 rows for a row that looks like column headers
  for (let r = 0; r < Math.min(cells.length, 10); r++) {
    const row = cells[r];
    const stringCells = row.filter(v => typeof v === 'string').map(v => (v as string).toLowerCase().trim());
    const hasDate = stringCells.some(s => ['date', 'game date', 'game_date'].includes(s));
    const hasRef = stringCells.some(s => s.includes('ref') && (s.includes('1') || s.includes('#1')));
    const hasTeam = stringCells.some(s => ['home', 'home team', 'away', 'away team', 'team 1'].includes(s));
    // Flat = has date header AND either team headers or ref headers on the same row
    if (hasDate && (hasTeam || (hasRef && stringCells.length >= 4))) {
      const headers = row.map(v => (typeof v === 'string' ? v.trim() : ''));
      return { isFlat: true, headerRow: r, headers };
    }
  }
  return { isFlat: false, headerRow: -1, headers: [] };
};

// ── Grouped Row Parser ───────────────────────────────────────────────────────

const parseGroupedRows = (cells: unknown[][]): Omit<LeagueParseResult, 'flatGames' | 'format'> => {
  let leagueName = '';
  for (const row of cells) {
    const firstVal = row[0];
    if (firstVal && typeof firstVal === 'string' && firstVal.trim().length > 3) {
      leagueName = firstVal.trim();
      break;
    }
  }

  const gameNights: LeagueGameNight[] = [];
  const refereeNamesSet = new Set<string>();
  let inTournamentSection = false;
  let currentNight: LeagueGameNight | null = null;

  for (let r = 0; r < cells.length; r++) {
    const row = cells[r];
    const colA = row[0];
    const colB = row[1];
    const colC = row[2];
    const colD = row[3];

    const rowText = row.map(v => (typeof v === 'string' ? v : '')).join(' ').toLowerCase();
    if (rowText.includes('tournament date')) { inTournamentSection = true; continue; }
    if (typeof colA === 'string' && colA.toLowerCase().trim() === 'date') continue;
    if (typeof colC === 'string' && colC.toLowerCase().includes('ref')) continue;

    const dateStr = normalizeExcelDate(colA);
    const timeStr = normalizeExcelTime(colB);

    if (dateStr) {
      if (currentNight && currentNight.times.length > 0) gameNights.push(currentNight);
      const ref1 = typeof colC === 'string' ? colC.trim() : '';
      const ref2 = typeof colD === 'string' ? colD.trim() : '';
      if (ref1) refereeNamesSet.add(ref1);
      if (ref2) refereeNamesSet.add(ref2);
      currentNight = { date: dateStr, times: timeStr ? [timeStr] : [], ref1, ref2, isTournament: inTournamentSection };
    } else if (timeStr && currentNight) {
      currentNight.times.push(timeStr);
    }
  }
  if (currentNight && currentNight.times.length > 0) gameNights.push(currentNight);

  return {
    leagueName,
    gameNights,
    refereeNames: Array.from(refereeNamesSet).sort(),
    errors: gameNights.length === 0
      ? ['Could not detect any game nights. Expected dates in column A, times in column B, referee names in C & D.']
      : [],
  };
};

// ── Flat Table Parser ────────────────────────────────────────────────────────

const parseFlatRows = (
  rawRows: Record<string, string>[],
  headers: string[],
): Omit<LeagueParseResult, 'gameNights' | 'format'> => {
  const colMap = buildFlatColumnMap(headers);
  const getVal = (row: Record<string, string>, key: string) => {
    const header = colMap[key];
    return header ? (row[header] || '').trim() : '';
  };

  const flatGames: FlatGameRow[] = [];
  const refSet = new Set<string>();

  for (const row of rawRows) {
    const date = normalizeExcelDate(getVal(row, 'date'));
    if (!date) continue;
    const time = normalizeExcelTime(getVal(row, 'time') || '');
    const ref1 = getVal(row, 'ref1');
    const ref2 = getVal(row, 'ref2');
    if (ref1) refSet.add(ref1);
    if (ref2) refSet.add(ref2);

    flatGames.push({
      date,
      time,
      ref1,
      ref2,
      homeTeam: getVal(row, 'homeTeam'),
      awayTeam: getVal(row, 'awayTeam'),
      venue: getVal(row, 'venue'),
      division: getVal(row, 'division'),
      fee: parseFloat(getVal(row, 'fee').replace(/[$,]/g, '')) || 0,
    });
  }

  // Derive league name from the first row's venue or just "Imported League"
  const leagueName = flatGames.length > 0 && flatGames[0].venue
    ? `League at ${flatGames[0].venue}`
    : 'Imported League';

  return {
    leagueName,
    flatGames,
    refereeNames: Array.from(refSet).sort(),
    errors: flatGames.length === 0
      ? ['No valid game rows found. Ensure your file has a Date column.']
      : [],
  };
};

// ── Excel Cell Reader ────────────────────────────────────────────────────────

const readExcelCells = (buffer: ArrayBuffer): unknown[][] => {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellNF: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const cells: unknown[][] = [];
  for (let r = 0; r <= range.e.r; r++) {
    const row: unknown[] = [];
    for (let c = 0; c <= Math.max(range.e.c, 8); c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      row.push(cell ? cell.v : null);
    }
    cells.push(row);
  }
  return cells;
};

// ── Public API ───────────────────────────────────────────────────────────────

export const parseLeagueScheduleFile = async (file: File): Promise<LeagueParseResult> => {
  const errors: string[] = [];
  const ext = file.name.split('.').pop()?.toLowerCase();

  // ── CSV Support ────────────────────────────────────────────────────────────
  if (ext === 'csv') {
    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
    });

    if (!result.data || result.data.length === 0) {
      return { leagueName: '', gameNights: [], flatGames: [], refereeNames: [], format: 'flat', errors: ['No data rows found in CSV.'] };
    }

    const headers = result.meta.fields || Object.keys(result.data[0]);
    const colMap = buildFlatColumnMap(headers);

    // If CSV has ref1/ref2 columns, parse as flat
    if (colMap.date) {
      const parsed = parseFlatRows(result.data, headers);
      return { ...parsed, gameNights: [], format: 'flat' };
    }

    return { leagueName: '', gameNights: [], flatGames: [], refereeNames: [], format: 'flat', errors: ['Could not find a Date column in the CSV.'] };
  }

  // ── Excel Support ──────────────────────────────────────────────────────────
  if (ext !== 'xlsx' && ext !== 'xls') {
    errors.push(`Unsupported file type: .${ext}. Please upload an Excel (.xlsx) or CSV file.`);
    return { leagueName: '', gameNights: [], flatGames: [], refereeNames: [], format: 'grouped', errors };
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (e) {
    errors.push(`Failed to read file: ${(e as Error).message}`);
    return { leagueName: '', gameNights: [], flatGames: [], refereeNames: [], format: 'grouped', errors };
  }

  const cells = readExcelCells(buffer);
  if (cells.length === 0) {
    return { leagueName: '', gameNights: [], flatGames: [], refereeNames: [], format: 'grouped', errors: ['Empty workbook.'] };
  }

  // Auto-detect format
  const { isFlat, headerRow, headers } = detectFlatFormat(cells);

  if (isFlat) {
    // Convert cells below the header row to keyed records
    const rawRows: Record<string, string>[] = [];
    for (let r = headerRow + 1; r < cells.length; r++) {
      const record: Record<string, string> = {};
      for (let c = 0; c < headers.length; c++) {
        const val = cells[r][c];
        record[headers[c]] = val != null ? String(val) : '';
      }
      rawRows.push(record);
    }
    const parsed = parseFlatRows(rawRows, headers);
    return { ...parsed, gameNights: [], format: 'flat' };
  }

  // Default: grouped row format
  const parsed = parseGroupedRows(cells);
  return { ...parsed, flatGames: [], format: 'grouped' };
};
