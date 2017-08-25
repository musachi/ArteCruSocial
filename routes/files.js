const uploads = require('../models/Uploads/uploads');
const ErrorResponse = require('../models/Service/error-response');
const writeResponse = require('../helpers/write-response')
    , messages = require('../helpers/messages').messages
    , util = require('util');
const status = require('../models/Service/status');
const dbPostgres = require('../pg/db-pg');
const files = require('../models/Files/files');
const _ = require('lodash');
const validateData = require('../helpers/validate-data');
const crypt = require('../helpers/crypt-helper');
const errors = require('../models/Service/errors');

exports.getAvatar = function (req, res, next) {
    try {
        const avatarId = _.get(req.query, 'id');
        if (validateData.isUndefined(avatarId))
            writeResponse.write(res, errors.BadRequestErrorResponse());
        else {
            const oid = crypt.decrypt(avatarId).split('_')[1];
            console.log("oid: " + oid);
            if (validateData.isUndefined(oid) || oid.length == 0)
                writeResponse.write(res, new ErrorResponse(status.BadRequest, ""));
            else {
                files.getAvatar(res, oid, function gettingAvatarCallback(response) {
                    writeResponse.write(res, response);
                });
            }
        }
    }
    catch (e) {
        console.log("error in decrypt: " + util.inspect(e));
        writeResponse.write(res, new ErrorResponse(status.BadRequest, ""));
    }
};
