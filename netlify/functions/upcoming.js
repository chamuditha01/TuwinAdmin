const { toNetlifyHandler } = require('./_adapter');
const upcoming = require('../../api/upcoming');

exports.handler = toNetlifyHandler(upcoming);
