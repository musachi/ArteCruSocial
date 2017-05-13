var ErrorResponse = require('../models/Service/error-response');
var status = require('../models/Service/status');
var messages = require('./messages');

var write = function (res, response) {
    res.status(response.status || 200).jsonp(response.data);
};

module.exports = {
    write: write
};