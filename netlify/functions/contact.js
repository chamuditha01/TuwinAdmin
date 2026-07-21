const { toNetlifyHandler } = require('./_adapter');
const contact = require('../../api/contact');

exports.handler = toNetlifyHandler(contact);
