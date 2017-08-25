const _ = require('lodash');

const Response = module.exports = function (status, data) {
    _.extend(this, {
        'status': status,
        'data': data
    });
};