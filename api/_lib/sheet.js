const XLSX = require('xlsx');

const SHEET_ID = process.env.SHEET_ID;

// Reads the spreadsheet via its public XLSX export (no auth needed for reads,
// mirrors the existing site's read pattern). The sheet must be shared as
// "Anyone with the link can view".
async function fetchWorkbook() {
  if (!SHEET_ID) {
    throw new Error('Missing SHEET_ID env var');
  }
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch workbook (${res.status})`);
  }
  const buf = await res.arrayBuffer();
  // Deliberately NOT using cellDates here: converting a date serial to a JS
  // Date and back to a string crosses through UTC, which can shift the
  // calendar date by a day depending on the spreadsheet's timezone. Instead
  // we keep raw serials and decode them with SSF (below), which reads the
  // y/m/d encoded in the serial directly with no timezone involved.
  // cellNF populates each cell's `.z` number-format string, which
  // cellToValue below needs to tell a date-formatted cell apart from a
  // plain number (it's not included by default).
  return XLSX.read(buf, { type: 'array', cellNF: true });
}

// Excel/Sheets store dates as plain numbers with a date number-format (e.g.
// "yyyy-mm-dd"); SSF.parse_date_code decodes the serial's y/m/d directly,
// with no timezone conversion, so this can't shift the calendar date.
function dateCellToValue(cell) {
  const code = XLSX.SSF.parse_date_code(cell.v);
  if (!code) return String(cell.v);
  const pad = (n) => String(n).padStart(2, '0');
  return `${code.y}-${pad(code.m)}-${pad(code.d)}`;
}

function cellToValue(cell) {
  if (cell === undefined) return '';
  if (cell.t === 'n' && cell.z && XLSX.SSF.is_date(cell.z)) return dateCellToValue(cell);
  return cell.v ?? '';
}

// Returns rows as objects keyed by the header row, each annotated with
// `_row`, the 1-indexed row number in the actual sheet (so edits/deletes
// can target the exact row via the Sheets API). Rows that are entirely
// blank (Google Sheets exports pad tabs with empty formatted rows) are
// dropped.
function getSheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  if (!sheet['!ref']) return [];

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const header = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
    header.push(cell ? String(cell.v ?? '').trim() : '');
  }

  const rows = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = { _row: r + 1 };
    header.forEach((key, c) => {
      if (!key) return;
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row[key] = cellToValue(cell);
    });
    rows.push(row);
  }

  return rows.filter((row) =>
    Object.keys(row).some((key) => key !== '_row' && String(row[key]).trim() !== '')
  );
}

// Header names only (trimmed, blanks dropped), independent of whether the
// sheet has any data rows yet — a category with zero images still needs to
// show up as an (empty) list.
function getHeaderRow(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) return [];

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const header = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
    const name = cell ? String(cell.v ?? '').trim() : '';
    if (name) header.push(name);
  }
  return header;
}

module.exports = { fetchWorkbook, getSheetRows, getHeaderRow, SHEET_ID };
