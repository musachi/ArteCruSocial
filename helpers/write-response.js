const ErrorResponse = require('../models/Service/error-response');
const status = require('../models/Service/status');
const messages = require('./messages');

const write = function (res, response) {
    res.status(response.status || 200).jsonp(response.data);
};

module.exports = {
    write: write
};