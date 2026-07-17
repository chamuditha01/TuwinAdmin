const { toNetlifyHandler } = require('./_adapter');
const bio = require('../../api/bio');

exports.handler = toNetlifyHandler(bio);
