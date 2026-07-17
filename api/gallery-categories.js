const { getSheetsClient, getTabId } = require('./_lib/sheetsClient');
const { SHEET_ID } = require('./_lib/sheet');
const { SHEET_NAME, columnLetter, getLiveCategories } = require('./_lib/galleryColumns');
const { deleteByUrl } = require('./_lib/cloudinary');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const name = String(req.body?.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Missing category name' });

      const sheets = getSheetsClient();
      const categories = await getLiveCategories(sheets);

      if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ error: `Category "${name}" already exists` });
      }

      const col = columnLetter(categories.length);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!${col}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [[name]] },
      });

      return res.status(201).json({ ok: true, name });
    }

    if (req.method === 'DELETE') {
      const name = req.query.name;
      if (!name) return res.status(400).json({ error: 'Missing category name' });

      const sheets = getSheetsClient();
      const categories = await getLiveCategories(sheets);
      const match = categories.find((c) => c.name === name);
      if (!match) return res.status(404).json({ error: `Unknown category "${name}"` });

      // Grab whatever URLs are in the column before the column itself (and
      // its data) is removed, so each image's Cloudinary asset can be
      // cleaned up too — otherwise deleting a category would just orphan
      // every image that was in it.
      const current = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!${match.col}2:${match.col}`,
      });
      const urls = (current.data.values || []).map((r) => r[0]).filter(Boolean);

      const sheetId = await getTabId(SHEET_NAME);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'COLUMNS',
                  startIndex: match.index,
                  endIndex: match.index + 1,
                },
              },
            },
          ],
        },
      });

      urls.forEach((url) => {
        deleteByUrl(url).catch((err) => console.warn('Cloudinary delete failed:', err.message));
      });

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('gallery-categories handler error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  }
};
