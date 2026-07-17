const { SHEET_ID } = require('./sheet');

const SHEET_NAME = 'Gallery';

function columnLetter(index) {
  let n = index + 1;
  let letter = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

// Live read of the header row (not the cached public export) — write
// endpoints need to know the current columns right before writing to them.
async function getLiveCategories(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!1:1`,
  });
  const names = res.data.values?.[0] || [];
  return names
    .map((name, i) => ({ name: String(name).trim(), col: columnLetter(i), index: i }))
    .filter((c) => c.name);
}

function resolveColumn(categories, name) {
  const match = categories.find((c) => c.name === name);
  if (!match) {
    throw Object.assign(new Error(`Unknown category "${name}"`), { status: 400 });
  }
  return match.col;
}

module.exports = { SHEET_NAME, columnLetter, getLiveCategories, resolveColumn };
