const _ = require('lodash');

const LoginResult = module.exports = function (user, token) {
        _.extend(this, {
               user: user,
               token: token
        });
};

