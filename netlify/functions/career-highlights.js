const { toNetlifyHandler } = require('./_adapter');
const careerHighlights = require('../../api/career-highlights');

exports.handler = toNetlifyHandler(careerHighlights);
