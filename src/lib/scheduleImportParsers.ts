/**
 * scheduleImportParsers.ts
 * Client-side parsing for CSV, Excel, and PDF schedule files.
 * Supports ArbiterSports, GameOfficials, and Assigning.net exports.
 */
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ParsedScheduleRow {
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  homeTeam: string;
  awayTeam: string;
  location: string;
  organization: string;
  fee: number;
  level: string;
  division: string;
  rawRow?: Record<string, string>;
}

export interface ParsedGameRow {
  homeTeam: string;
  awayTeam: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  venue: string;
  division: string;
  level: string;
  payment: number;
  court: string;
  rawRow?: Record<string, string>;
}

export interface ParseResult<T> {
  rows: T[];
  headers: string[];
  errors: string[];
  totalRawRows: number;
}

// ── Column Mapping Helpers ───────────────────────────────────────────────────

const COLUMN_ALIASES: Record<string, string[]> = {
  date:         ['game date', 'date', 'game_date', 'gamedate', 'start date', 'match date'],
  time:         ['game time', 'time', 'game_time', 'gametime', 'start time', 'start'],
  homeTeam:     ['home', 'home team', 'home_team', 'hometeam', 'team 1', 'team1'],
  awayTeam:     ['away', 'visitor', 'away team', 'away_team', 'awayteam', 'visiting', 'team 2', 'team2', 'visitors'],
  location:     ['location', 'site', 'venue', 'site name', 'site_name', 'facility', 'field', 'gym', 'arena', 'court location'],
  organization: ['organization', 'league', 'assigner', 'group', 'org', 'assignor', 'body', 'association'],
  fee:          ['fee', 'pay', 'amount', 'game fee', 'game_fee', 'payment', 'rate', 'compensation', 'pay rate'],
  level:        ['level', 'game level', 'game_level', 'classification'],
  division:     ['division', 'grade', 'age group', 'age_group', 'agegroup', 'class', 'bracket', 'pool'],
  payment:      ['fee', 'pay', 'amount', 'game fee', 'payment', 'rate', 'compensation'],
  court:        ['court', 'court #', 'court number', 'court_number', 'ct'],
};

/** Match a header name (case-insensitive, trimmed) to one of our known field keys. */
const resolveColumnKey = (header: string): string | null => {
  const h = header.toLowerCase().trim();
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(h)) return key;
  }
  return null;
};

/** Build a mapping from our field keys to actual CSV/Excel column headers. */
const buildColumnMap = (headers: string[]): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const header of headers) {
    const key = resolveColumnKey(header);
    if (key && !map[key]) map[key] = header;
  }
  return map;
};

// ── Date / Time Normalization ────────────────────────────────────────────────

/** Normalize a date string to YYYY-MM-DD. Supports MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD, etc. */
export const normalizeDate = (raw: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // MM/DD/YYYY or M/D/YYYY or MM-DD-YYYY
  const mdyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try native Date parsing as fallback
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return '';
};

/** Normalize a time string to HH:MM (24-hour). */
export const normalizeTime = (raw: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();

  // Already HH:MM or HH:MM:SS
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    return trimmed.slice(0, 5).padStart(5, '0');
  }

  // 12-hour format: "9:00 AM", "12:30 PM"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const min = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}`;
  }
  return '';
};

// ── Row Normalization ────────────────────────────────────────────────────────

const getVal = (row: Record<string, string>, colMap: Record<string, string>, key: string): string => {
  const header = colMap[key];
  return header ? (row[header] || '').trim() : '';
};

const normalizeScheduleRow = (row: Record<string, string>, colMap: Record<string, string>): ParsedScheduleRow => ({
  date: normalizeDate(getVal(row, colMap, 'date')),
  time: normalizeTime(getVal(row, colMap, 'time')),
  homeTeam: getVal(row, colMap, 'homeTeam'),
  awayTeam: getVal(row, colMap, 'awayTeam'),
  location: getVal(row, colMap, 'location'),
  organization: getVal(row, colMap, 'organization'),
  fee: parseFloat(getVal(row, colMap, 'fee').replace(/[$,]/g, '')) || 0,
  level: getVal(row, colMap, 'level'),
  division: getVal(row, colMap, 'division'),
  rawRow: row,
});

const normalizeGameRow = (row: Record<string, string>, colMap: Record<string, string>): ParsedGameRow => ({
  homeTeam: getVal(row, colMap, 'homeTeam'),
  awayTeam: getVal(row, colMap, 'awayTeam'),
  date: normalizeDate(getVal(row, colMap, 'date')),
  time: normalizeTime(getVal(row, colMap, 'time')),
  venue: getVal(row, colMap, 'location'),
  division: getVal(row, colMap, 'division'),
  level: getVal(row, colMap, 'level'),
  payment: parseFloat(getVal(row, colMap, 'payment').replace(/[$,]/g, '')) || 0,
  court: getVal(row, colMap, 'court'),
  rawRow: row,
});

// ── CSV Parsing ──────────────────────────────────────────────────────────────

const parseCSVText = (text: string): Record<string, string>[] => {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });
  return result.data || [];
};

// ── Excel Parsing ────────────────────────────────────────────────────────────

const parseExcelBuffer = (buffer: ArrayBuffer): Record<string, string>[] => {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
};

// ── PDF Text Extraction ──────────────────────────────────────────────────────

const extractPDFText = async (buffer: ArrayBuffer): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: { str?: string }) => item.str || '')
      .join(' ');
    pages.push(text);
  }
  return pages.join('\n');
};

/** Try to extract rows from PDF text by splitting on date patterns. */
const parsePDFTextToRows = (text: string): Record<string, string>[] => {
  const rows: Record<string, string>[] = [];
  // Split on date patterns (MM/DD/YYYY or YYYY-MM-DD)
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/g;
  const segments = text.split(datePattern).filter(Boolean);

  for (let i = 0; i < segments.length - 1; i += 2) {
    const dateStr = segments[i];
    const rest = (segments[i + 1] || '').trim();

    // Try to extract time
    const timeMatch = rest.match(/(\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?)/);
    const time = timeMatch ? timeMatch[1] : '';

    // Try to extract "vs" or "at" pattern for teams
    const vsMatch = rest.match(/(.+?)\s+(?:vs\.?|v\.?)\s+(.+?)(?:\s+at\s+|\s+@\s+|$)/i);
    const homeTeam = vsMatch ? vsMatch[1].trim() : '';
    const awayTeam = vsMatch ? vsMatch[2].trim().split(/\s{2,}/)[0] : '';

    // Try to extract fee ($XX or $XX.XX)
    const feeMatch = rest.match(/\$(\d+(?:\.\d{2})?)/);
    const fee = feeMatch ? feeMatch[1] : '';

    // Location: after "at" or "@"
    const locMatch = rest.match(/(?:at|@)\s+(.+?)(?:\s+\$|$)/i);
    const location = locMatch ? locMatch[1].trim() : '';

    if (dateStr) {
      rows.push({
        Date: dateStr,
        Time: time,
        'Home Team': homeTeam,
        'Away Team': awayTeam,
        Location: location,
        Fee: fee,
        Level: '',
        Division: '',
        Organization: '',
      });
    }
  }
  return rows;
};

// ── Public API ───────────────────────────────────────────────────────────────

/** Parse a file for referee schedule import (CSV or PDF). */
export const parseRefereeScheduleFile = async (
  file: File,
): Promise<ParseResult<ParsedScheduleRow>> => {
  const errors: string[] = [];
  let rawRows: Record<string, string>[] = [];
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const text = await file.text();
    rawRows = parseCSVText(text);
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    rawRows = parseExcelBuffer(buffer);
  } else if (ext === 'pdf') {
    try {
      const buffer = await file.arrayBuffer();
      const text = await extractPDFText(buffer);
      rawRows = parsePDFTextToRows(text);
      if (rawRows.length === 0) {
        errors.push('Could not extract tabular data from this PDF. Try exporting as CSV from your scheduling platform.');
      }
    } catch (e) {
      errors.push(`PDF parsing error: ${(e as Error).message}`);
    }
  } else {
    errors.push(`Unsupported file type: .${ext}. Please upload a CSV, Excel, or PDF file.`);
    return { rows: [], headers: [], errors, totalRawRows: 0 };
  }

  if (rawRows.length === 0 && errors.length === 0) {
    errors.push('No data rows found in the file.');
    return { rows: [], headers: [], errors, totalRawRows: 0 };
  }

  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const colMap = buildColumnMap(headers);

  // Must have at least a date column
  if (!colMap.date) {
    errors.push('Could not find a "Date" column. Please ensure your file has a column named Date, Game Date, or similar.');
  }

  const rows = rawRows
    .map(r => normalizeScheduleRow(r, colMap))
    .filter(r => r.date !== '');

  return { rows, headers, errors, totalRawRows: rawRows.length };
};

/** Parse a file for manager bulk game import (CSV or Excel). */
export const parseManagerGameFile = async (
  file: File,
): Promise<ParseResult<ParsedGameRow>> => {
  const errors: string[] = [];
  let rawRows: Record<string, string>[] = [];
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const text = await file.text();
    rawRows = parseCSVText(text);
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    rawRows = parseExcelBuffer(buffer);
  } else {
    errors.push(`Unsupported file type: .${ext}. Please upload a CSV or Excel file.`);
    return { rows: [], headers: [], errors, totalRawRows: 0 };
  }

  if (rawRows.length === 0 && errors.length === 0) {
    errors.push('No data rows found in the file.');
    return { rows: [], headers: [], errors, totalRawRows: 0 };
  }

  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const colMap = buildColumnMap(headers);

  if (!colMap.homeTeam && !colMap.date) {
    errors.push('Could not find expected columns (Home Team, Date, etc.). Please check the file format.');
  }

  const rows = rawRows
    .map(r => normalizeGameRow(r, colMap))
    .filter(r => r.date !== '' || r.homeTeam !== '');

  return { rows, headers, errors, totalRawRows: rawRows.length };
};

/** Utility: check whether a date string is in the past. */
export const isDateInPast = (dateStr: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d < today;
};

/** Column map builder exposed for custom mapping UI. */
export { buildColumnMap, resolveColumnKey };

// ── Template Downloads ───────────────────────────────────────────────────────

const triggerDownload = (content: string, filename: string, mime = 'text/csv') => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/** Download a CSV template for referee schedule import. */
export const downloadRefereeTemplate = () => {
  const csv = [
    'Game Date,Game Time,Home Team,Away Team,Location,Fee,Level,Division,Organization',
    '01/15/2026,09:00 AM,Hawks,Eagles,Atlanta Sports Center,$75,Varsity,U14 Boys,ArbiterSports',
    '03/22/2026,02:30 PM,Tigers,Lions,Peachtree Gym,$85,JV,U16 Girls,GameOfficials',
  ].join('\n');
  triggerDownload(csv, 'iWhistle_Schedule_Template.csv');
};

/** Download a CSV template for manager bulk game import. */
export const downloadManagerTemplate = () => {
  const csv = [
    'Date,Time,Home Team,Away Team,Venue,Division,Level,Fee,Court',
    '2026-05-15,09:00,Team Alpha,Team Beta,Court 1 - Atlanta Arena,U14 Boys,Varsity,75,1',
    '2026-05-15,10:30,Team Gamma,Team Delta,Court 2 - Atlanta Arena,U14 Boys,Varsity,75,2',
  ].join('\n');
  triggerDownload(csv, 'iWhistle_Game_Import_Template.csv');
};

