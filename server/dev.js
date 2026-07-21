// Local-only dev server that mounts the /api serverless functions behind
// Express, since `react-scripts start` alone doesn't run them. On Vercel,
// each file in /api is deployed directly as its own serverless function and
// this file is never used.
require('dotenv').config();
const express = require('express');

const articles = require('../api/articles');
const gallery = require('../api/gallery');
const galleryCategories = require('../api/gallery-categories');
const bio = require('../api/bio');
const sponsors = require('../api/sponsors');
const packages = require('../api/packages');
const cloudinaryDelete = require('../api/cloudinary-delete');
const upcoming = require('../api/upcoming');
const coachClub = require('../api/coach-club');
const biography = require('../api/biography');
const { TABS } = require('../api/_lib/simpleTabs');

const app = express();
app.use(express.json());

app.all('/api/articles', (req, res) => articles(req, res));
app.all('/api/gallery', (req, res) => gallery(req, res));
app.all('/api/gallery-categories', (req, res) => galleryCategories(req, res));
app.all('/api/bio', (req, res) => bio(req, res));
app.all('/api/sponsors', (req, res) => sponsors(req, res));
app.all('/api/packages', (req, res) => packages(req, res));
app.all('/api/cloudinary-delete', (req, res) => cloudinaryDelete(req, res));
app.all('/api/upcoming', (req, res) => upcoming(req, res));
app.all('/api/coach-club', (req, res) => coachClub(req, res));
app.all('/api/biography', (req, res) => biography(req, res));

// Rankings, Career Achievements, Career Highlights, Competency Blueprint,
// Training History, Contact — mirrors api/[tab].js's dynamic dispatch.
app.all('/api/:tab', (req, res) => {
  const fn = TABS[req.params.tab];
  if (!fn) return res.status(404).json({ error: 'Unknown resource' });
  return fn(req, res);
});

const port = process.env.API_PORT || 5001;
app.listen(port, () => {
  console.log(`API dev server running on http://localhost:${port}`);
});
