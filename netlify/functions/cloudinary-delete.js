const { toNetlifyHandler } = require('./_adapter');
const cloudinaryDelete = require('../../api/cloudinary-delete');

exports.handler = toNetlifyHandler(cloudinaryDelete);
