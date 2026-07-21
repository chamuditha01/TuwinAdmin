const { toNetlifyHandler } = require('./_adapter');
const careerAchievements = require('../../api/career-achievements');

exports.handler = toNetlifyHandler(careerAchievements);
