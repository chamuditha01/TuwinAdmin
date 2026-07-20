const { fetchWorkbook, getSheetRows, SHEET_ID } = require('./_lib/sheet');
const { getSheetsClient, getTabId } = require('./_lib/sheetsClient');
const { deleteByUrl } = require('./_lib/cloudinary');

const SHEET_NAME = 'UpcomingTournaments';
const COLUMNS = [
  'Name',
  'Venue',
  'Tournament Size',
  'Start Date',
  'End Date',
  'Tournament Category',
  'Finished Position',
  'Status',
  'logo',
];
const STATUSES = ['upcoming', 'completed'];
const LOGO_COL = 'I'; // 9th column, matches COLUMNS order above

function rowToValues(body) {
  return COLUMNS.map((key) => (body[key] ?? '').toString());
}

function validateBody(body) {
  const status = body?.Status;
  if (!STATUSES.includes(status)) {
    throw Object.assign(new Error(`Status must be one of: ${STATUSES.join(', ')}`), { status: 400 });
  }
  if (status === 'completed' && !String(body['Finished Position'] ?? '').trim()) {
    throw Object.assign(new Error('Finished Position is required when Status is Completed'), {
      status: 400,
    });
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const workbook = await fetchWorkbook();
      const rows = getSheetRows(workbook, SHEET_NAME);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      validateBody(req.body);

      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:I`,
        // RAW stores both dates exactly as given (plain text) instead of
        // letting Sheets auto-parse them, which round-trips through the
        // spreadsheet's locale and can shift the date by a day.
        valueInputOption: 'RAW',
        requestBody: { values: [rowToValues(req.body)] },
      });
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const row = Number(req.query.row);
      if (!row || row < 2) return res.status(400).json({ error: 'Missing or invalid row' });
      validateBody(req.body);

      const sheets = getSheetsClient();

      // If the logo was replaced, the old Cloudinary asset would otherwise
      // be orphaned — read what's currently stored so it can be cleaned up
      // once the new value is safely saved.
      const current = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!${LOGO_COL}${row}`,
      });
      const previousLogo = current.data.values?.[0]?.[0];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A${row}:I${row}`,
        valueInputOption: 'RAW',
        requestBody: { values: [rowToValues(req.body)] },
      });

      const newLogo = req.body?.logo;
      if (previousLogo && previousLogo !== newLogo) {
        deleteByUrl(previousLogo).catch((err) => console.warn('Cloudinary delete failed:', err.message));
      }

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const row = Number(req.query.row);
      if (!row || row < 2) return res.status(400).json({ error: 'Missing or invalid row' });

      const sheets = getSheetsClient();

      const current = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!${LOGO_COL}${row}`,
      });
      const logo = current.data.values?.[0]?.[0];

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

      if (logo) {
        deleteByUrl(logo).catch((err) => console.warn('Cloudinary delete failed:', err.message));
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('upcoming handler error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  }
};
