const { toNetlifyHandler } = require('./_adapter');
const rankings = require('../../api/rankings');

exports.handler = toNetlifyHandler(rankings);
