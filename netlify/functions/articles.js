const { toNetlifyHandler } = require('./_adapter');
const articles = require('../../api/articles');

exports.handler = toNetlifyHandler(articles);
