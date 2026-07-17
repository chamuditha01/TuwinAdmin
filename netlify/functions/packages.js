const { toNetlifyHandler } = require('./_adapter');
const packages = require('../../api/packages');

exports.handler = toNetlifyHandler(packages);
