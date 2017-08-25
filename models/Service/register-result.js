const _ = require('lodash');

/**
 *
 * @param User
 * @param RegisterStatus
 * @constructor
 */

const RegisterResult = module.exports = function (User) {
    _.extend(this, {
        'user': User,
    });
};
