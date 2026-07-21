const { TABS } = require('./_lib/simpleTabs');

// Dynamic catch-all for the plain CRUD tabs in _lib/simpleTabs.js — Vercel
// counts this as a single serverless function no matter how many tab keys
// are added, unlike one file per tab.
module.exports = async function handler(req, res) {
  const fn = TABS[req.query.tab];
  if (!fn) return res.status(404).json({ error: 'Unknown resource' });
  return fn(req, res);
};
