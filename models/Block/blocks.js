/**
 * model blocks
 */

const uuid = require('uuid');
const randomstring = require("randomstring");
const _ = require('lodash');
const crypto = require('crypto');

let User = require('../neo4j_model/user');
let LoginResult = require('../Service/login-result');
const status = require('../Service/status');
const Cypher = require('../../neo4j/cypher');
const constants = require('../../helpers/contants').constants;
const dateHelper = require('../../helpers/date-helper');
const jwt = require('jsonwebtoken');
const arts = require('../../helpers/contants').arts();
const util = require('util');
let Response = require('../Service/response');
let ErrorResponse = require('../Service/error-response');
const messages = require('../../helpers/messages').messages;
const errors = require('../Service/errors');
const invitationStatus = require('../Service/invitation-status');
const validateData = require('../../helpers/validate-data');

const blockUser = function (session, id, user_id) {
    return session.run(Cypher.blockUser(), {
        id: id,
        user_id: user_id
    }).then(function blockUserResult(result) {
        if (result.records[0].keys.indexOf("true") >= 0)
            return new Response(status.Ok, {done: true});
        else
            return new Response(status.BadRequest, ""); //TODO message for already blocked

    }).catch(function blockUserError(err) {
        console.log("error model block user: " + util.inspect(err));
    });
};

const unblockUser = function (session, id, user_id) {
    return session.run(Cypher.unblockUser(), {
        id: id,
        user_id: user_id
    }).then(function unblockUserResult(result) {
        return new Response(status.Ok, {done: true});
    }).catch(function unblockUserError(err) {
        console.log("error model block user: " + util.inspect(err));
    });
};

const getBlockedUsers = function (session, id, limit, offset) {
    return session.run(Cypher.unblockUser(), {
        id: id,
        user_id: user_id
    }).then(function getBlockUsers(result) {
        return new Response(status.Ok, {done: true});
    }).catch(function unblockUserError(err) {
        console.log("error model block user: " + util.inspect(err));
    });
};

module.exports = {
    blockUser: blockUser,
    unblockUser: unblockUser
};