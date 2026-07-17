const { fetchWorkbook, getSheetRows, SHEET_ID } = require('./_lib/sheet');
const { getSheetsClient } = require('./_lib/sheetsClient');
const { deleteByUrl } = require('./_lib/cloudinary');

const SHEET_NAME = 'Gallery';

// local/international are independent lists that happen to share a sheet;
// each keeps its own column so adding/removing one never touches the other.
const COLUMN_LETTER = { local: 'A', international: 'B' };

function assertType(type) {
  if (type !== 'local' && type !== 'international') {
    throw Object.assign(new Error('type must be "local" or "international"'), { status: 400 });
  }
}

async function getColumnValues(sheets, col) {
  const current = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!${col}2:${col}`,
  });
  return (current.data.values || []).map((r) => r[0] ?? '');
}

// Row right after the last non-blank cell in this column. Using an exact
// single-cell `values.update` (not `values.append`) is deliberate: append
// auto-detects a "table" by expanding into contiguous data in adjacent
// columns, so on a row where both local+international are filled it was
// putting single-column appends into the wrong column entirely.
async function nextRowFor(sheets, col) {
  const values = await getColumnValues(sheets, col);
  let lastFilled = -1;
  values.forEach((v, i) => {
    if (String(v).trim()) lastFilled = i;
  });
  return lastFilled + 3; // values[i] lives at sheet row i+2; next free row is that +1
}

async function writeCell(sheets, col, row, value) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!${col}${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] },
  });
}

// Removes the value at `row` in `col`, shifting everything below up by one
// (mirrors the DELETE handler's approach) so gaps aren't left behind.
async function removeCell(sheets, col, row) {
  const values = await getColumnValues(sheets, col);
  const targetIdx = row - 2;
  const removedValue = values[targetIdx];
  if (removedValue === undefined) return undefined;

  values.splice(targetIdx, 1);
  values.push('');

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!${col}2:${col}${values.length + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: values.map((v) => [v]) },
  });
  return removedValue;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const workbook = await fetchWorkbook();
      const rows = getSheetRows(workbook, SHEET_NAME);

      const local = rows
        .filter((r) => String(r.local ?? '').trim())
        .map((r) => ({ row: r._row, url: String(r.local).trim() }));
      const international = rows
        .filter((r) => String(r.international ?? '').trim())
        .map((r) => ({ row: r._row, url: String(r.international).trim() }));

      return res.status(200).json({ local, international });
    }

    if (req.method === 'POST') {
      const { type, url } = req.body || {};
      assertType(type);
      if (!url) return res.status(400).json({ error: 'Missing url' });

      const col = COLUMN_LETTER[type];
      const sheets = getSheetsClient();
      const row = await nextRowFor(sheets, col);
      await writeCell(sheets, col, row, url);
      return res.status(201).json({ ok: true });
    }

    // Moves an image from one column to the other without touching
    // Cloudinary (the asset itself doesn't change, just which list it's in).
    if (req.method === 'PATCH') {
      const { type, row, toType } = req.body || {};
      assertType(type);
      assertType(toType);
      if (type === toType) return res.status(400).json({ error: 'toType must differ from type' });
      if (!row || row < 2) return res.status(400).json({ error: 'Missing or invalid row' });

      const sheets = getSheetsClient();
      const fromCol = COLUMN_LETTER[type];
      const toCol = COLUMN_LETTER[toType];

      const url = await removeCell(sheets, fromCol, row);
      if (url === undefined || !url) return res.status(404).json({ error: 'Row not found' });

      const targetRow = await nextRowFor(sheets, toCol);
      await writeCell(sheets, toCol, targetRow, url);

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const type = req.query.type;
      const row = Number(req.query.row);
      assertType(type);
      if (!row || row < 2) return res.status(400).json({ error: 'Missing or invalid row' });

      const col = COLUMN_LETTER[type];
      const sheets = getSheetsClient();
      const removedUrl = await removeCell(sheets, col, row);
      if (removedUrl === undefined) return res.status(404).json({ error: 'Row not found' });

      if (removedUrl) {
        deleteByUrl(removedUrl).catch((err) => console.warn('Cloudinary delete failed:', err.message));
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('gallery handler error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  }
};
