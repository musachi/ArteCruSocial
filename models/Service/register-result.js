var _ = require('lodash');

/**
 *
 * @param User
 * @param RegisterStatus
 * @constructor
 */

var RegisterResult = module.exports = function (User) {
    _.extend(this, {
        'user': User,
    });
};
