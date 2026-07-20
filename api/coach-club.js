const { fetchWorkbook, getSheetRows, SHEET_ID } = require('./_lib/sheet');
const { getSheetsClient, getTabId } = require('./_lib/sheetsClient');
const { deleteByUrl } = require('./_lib/cloudinary');

const SHEET_NAME = 'Coach&Club';
// The sheet name contains "&", which A1 range notation requires quoting —
// unlike every other tab here, so this can't just be `${SHEET_NAME}!...`.
const RANGE_PREFIX = `'${SHEET_NAME}'`;
const COLUMNS = ['Name', 'Profile', 'Biography', 'Image Url'];
const IMAGE_COL = 'D';

function rowToValues(body) {
  return COLUMNS.map((key) => (body[key] ?? '').toString());
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const workbook = await fetchWorkbook();
      const rows = getSheetRows(workbook, SHEET_NAME);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${RANGE_PREFIX}!A:D`,
        valueInputOption: 'RAW',
        requestBody: { values: [rowToValues(req.body)] },
      });
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const row = Number(req.query.row);
      if (!row || row < 2) return res.status(400).json({ error: 'Missing or invalid row' });

      const sheets = getSheetsClient();

      // If the image was replaced, the old Cloudinary asset would otherwise
      // be orphaned — read what's currently stored so it can be cleaned up
      // once the new value is safely saved.
      const current = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${RANGE_PREFIX}!${IMAGE_COL}${row}`,
      });
      const previousImage = current.data.values?.[0]?.[0];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${RANGE_PREFIX}!A${row}:D${row}`,
        valueInputOption: 'RAW',
        requestBody: { values: [rowToValues(req.body)] },
      });

      const newImage = req.body?.['Image Url'];
      if (previousImage && previousImage !== newImage) {
        deleteByUrl(previousImage).catch((err) =>
          console.warn('Cloudinary delete failed:', err.message)
        );
      }

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const row = Number(req.query.row);
      if (!row || row < 2) return res.status(400).json({ error: 'Missing or invalid row' });

      const sheets = getSheetsClient();

      const current = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${RANGE_PREFIX}!${IMAGE_COL}${row}`,
      });
      const image = current.data.values?.[0]?.[0];

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

      if (image) {
        deleteByUrl(image).catch((err) => console.warn('Cloudinary delete failed:', err.message));
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('coach-club handler error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  }
};
