const { toNetlifyHandler } = require('./_adapter');
const trainingHistory = require('../../api/training-history');

exports.handler = toNetlifyHandler(trainingHistory);
