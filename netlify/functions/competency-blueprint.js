const { toNetlifyHandler } = require('./_adapter');
const competencyBlueprint = require('../../api/competency-blueprint');

exports.handler = toNetlifyHandler(competencyBlueprint);
