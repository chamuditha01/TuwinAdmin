const { google } = require('googleapis');
const { SHEET_ID } = require('./sheet');

let sheetsApi = null;
const sheetIdCache = new Map();

// Authenticated client for WRITES only. Reads go through the public export
// (see sheet.js) so this key only needs Editor access, not read scopes.
function getSheetsClient() {
  if (sheetsApi) return sheetsApi;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY env vars');
  }

  const auth = new google.auth.JWT({
    email,
    // Env vars can't hold real newlines, so private keys are stored with
    // literal \n and unescaped here.
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsApi = google.sheets({ version: 'v4', auth });
  return sheetsApi;
}

// Numeric sheetId (gid) for a tab by name, needed for row-delete requests.
async function getTabId(sheetName) {
  if (sheetIdCache.has(sheetName)) return sheetIdCache.get(sheetName);

  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find((s) => s.properties.title === sheetName);
  if (!tab) throw new Error(`Sheet tab "${sheetName}" not found`);

  sheetIdCache.set(sheetName, tab.properties.sheetId);
  return tab.properties.sheetId;
}

module.exports = { getSheetsClient, getTabId, SHEET_ID };
