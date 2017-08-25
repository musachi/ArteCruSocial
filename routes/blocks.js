/**
 * router blocks
 */

const dbNeo4j = require('../neo4j/db-neo4j')
    , users = require('../models/User/users')
    , _ = require('lodash')
    , status = require('../models/Service/status')
    , validateData = require('../helpers/validate-data')
    , constantsVars = require('../helpers/contants')
    , User = require('../models/neo4j_model/user')
    , Response = require('../models/Service/response')
    , ErrorResponse = require('../models/Service/error-response')
    , writeResponse = require('../helpers/write-response')
    , messages = require('../helpers/messages').messages
    , util = require('util')
    , errors = require('../models/Service/errors')
    , blocks = require('../models/Block/blocks');

let validRegisterData = true;
let validLoginData = true;
const constants = constantsVars.constants;
const arts = constantsVars.arts();

exports.blockUser = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const id = req.user['id'];
    const user_id = req.body.user_id;

    if (validateData.isUndefined(user_id))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else if (validateData.isUndefined(id)) {
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    }
    else
    {
        blocks.blockUser(session, id, user_id)
            .then(function blockUserCallback(response){
                writeResponse.write(res, response);
            }).catch(function blockUserError(err){
            console.log("route block user error: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        })
    }
};

exports.unblockUser = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const id = req.user['id'];
    const user_id = req.body.user_id;

    if (validateData.isUndefined(user_id))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else if (validateData.isUndefined(id)) {
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    }
    else
    {
        blocks.unblockUser(session, id, user_id)
            .then(function unblockUserCallback(response){
                writeResponse.write(res, response);
            }).catch(function unblockUserError(err){
            console.log("route block user error: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        })
    }
};

const getBlockUsers = function()
{

};
