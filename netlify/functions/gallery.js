const { toNetlifyHandler } = require('./_adapter');
const gallery = require('../../api/gallery');

exports.handler = toNetlifyHandler(gallery);
