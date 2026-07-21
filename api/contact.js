const { fetchWorkbook, getSheetRows, SHEET_ID } = require('./_lib/sheet');
const { getSheetsClient, getTabId } = require('./_lib/sheetsClient');

const SHEET_NAME = 'Contact';
const COLUMNS = ['Locations', 'email', 'phone numbers'];

function rowToValues(body) {
  return COLUMNS.map((key) => (body[key] ?? '').toString());
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const workbook = await fetchWorkbook();
      // A pre-existing row had its phone numbers entered as a plain number,
      // so Sheets/xlsx may hand it back as a JS number instead of a string —
      // coerce every cell to text here rather than pushing that
      // string-vs-number distinction onto the frontend.
      const rows = getSheetRows(workbook, SHEET_NAME).map((row) => ({
        ...row,
        'phone numbers': String(row['phone numbers'] ?? ''),
      }));
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:C`,
        // RAW keeps phone numbers as literal text — letting Sheets
        // auto-parse them as numbers is exactly what caused the pre-existing
        // row's phone number to lose its type as a phone number in the
        // first place.
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
        range: `${SHEET_NAME}!A${row}:C${row}`,
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
    console.error('contact handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
