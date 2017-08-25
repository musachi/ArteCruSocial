const _ = require('lodash');

const ErrorResponse = module.exports = function (status, message) {
    _.extend(this, {
        'status': status,
        'data': {
            'message': message
        }
    });
};

