const { toNetlifyHandler } = require('./_adapter');
const coachClub = require('../../api/coach-club');

exports.handler = toNetlifyHandler(coachClub);
