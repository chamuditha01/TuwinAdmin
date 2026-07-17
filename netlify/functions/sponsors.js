const { toNetlifyHandler } = require('./_adapter');
const sponsors = require('../../api/sponsors');

exports.handler = toNetlifyHandler(sponsors);
