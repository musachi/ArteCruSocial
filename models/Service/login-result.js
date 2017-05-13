var _ = require('lodash');

var LoginResult = module.exports = function (user, token) {
        _.extend(this, {
               user: user,
               token: token
        });
};

