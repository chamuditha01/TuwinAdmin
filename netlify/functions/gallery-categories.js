const { toNetlifyHandler } = require('./_adapter');
const galleryCategories = require('../../api/gallery-categories');

exports.handler = toNetlifyHandler(galleryCategories);
