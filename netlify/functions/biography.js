const { toNetlifyHandler } = require('./_adapter');
const biography = require('../../api/biography');

exports.handler = toNetlifyHandler(biography);
