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

const app = express();
app.use(express.json());

app.all('/api/articles', (req, res) => articles(req, res));
app.all('/api/gallery', (req, res) => gallery(req, res));
app.all('/api/gallery-categories', (req, res) => galleryCategories(req, res));
app.all('/api/bio', (req, res) => bio(req, res));
app.all('/api/sponsors', (req, res) => sponsors(req, res));
app.all('/api/packages', (req, res) => packages(req, res));
app.all('/api/cloudinary-delete', (req, res) => cloudinaryDelete(req, res));

const port = process.env.API_PORT || 5001;
app.listen(port, () => {
  console.log(`API dev server running on http://localhost:${port}`);
});
