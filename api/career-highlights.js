const { fetchWorkbook, getSheetRows, SHEET_ID } = require('./_lib/sheet');
const { getSheetsClient, getTabId } = require('./_lib/sheetsClient');

const SHEET_NAME = 'CareerHighlights';
const COLUMNS = ['year', 'title', 'description', 'tag', 'icon'];

function rowToValues(body) {
  return COLUMNS.map((key) => (body[key] ?? '').toString());
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const workbook = await fetchWorkbook();
      // Existing rows have "year" entered as a plain number, so xlsx hands
      // it back as a JS number — coerce to text here rather than pushing
      // that string-vs-number distinction onto the frontend.
      const rows = getSheetRows(workbook, SHEET_NAME).map((row) => ({
        ...row,
        year: String(row.year ?? ''),
      }));
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:E`,
        // RAW keeps "year" as literal text instead of letting Sheets
        // auto-parse it as a number again.
        valueInputOption: 'RAW',
        requestBody: { values: [rowToValues(req.body)] },
      });
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const row = Number(req.query.row);
      if (!row || row < 2) return res.status(400).json({ error: 'Missing or invalid row' });

      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A${row}:E${row}`,
        valueInputOption: 'RAW',
        requestBody: { values: [rowToValues(req.body)] },
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const row = Number(req.query.row);
      if (!row || row < 2) return res.status(400).json({ error: 'Missing or invalid row' });

      const sheets = getSheetsClient();
      const sheetId = await getTabId(SHEET_NAME);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: row - 1,
                  endIndex: row,
                },
              },
            },
          ],
        },
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('career-highlights handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
