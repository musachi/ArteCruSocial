/**
 *model messages
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
const crypt = require('../../helpers/crypt-helper');
const Post = require('../neo4j_model/post');
const File = require('../neo4j_model/file');
const async = require('async');
const sqlQuery = require('../../pg/sql');
const Message = require('./message-model');

const sendMessage = function (pgpClient, message) {
    const time = dateHelper.getTime();
    message['time'] = time;
    console.log("message: " + util.inspect(message));
    return pgpClient.one(sqlQuery.insertMessage(), message).then(function (data) {
        console.log("data: " + util.inspect(data));
        return new Response(status.Ok, data);
    }).catch(function sendMessageError(err) {
        console.log("model sending message error: " + util.inspect(err));
        return errors.InternalErrorResponse();
    });
};

const getLastMessages = function (pgpClient, user_id, offset, limit) {
    console.log("entering here");
    return pgpClient.any(sqlQuery.getLastMessages(), {
        user_id: user_id,
        last_message_index: 4,
        offset: offset,
        limit: limit
    }).then(function getMessagesResults(results) {
        console.log("results: " + util.inspect(results));
        const m = _.map(results, r => {
            //TODO create message and return it with id
            //new Message(r.owner_user_id, r.target_id, )
            console.log(util.inspect(r));
            return r;
        });

        if (offset == 0 && m.length > 0)
            pgpClient.none(sqlQuery.upsertLastIndexRequest(), {
                user_id: user_id,
                last_index_request: m[0].id
            });

        return m;
    }).catch(function getMessageError(err) {
        console.log("error model getting mesages: " + util.inspect(err));
        return errors.InternalErrorResponse();
    });
};

module.exports = {
    sendMessage: sendMessage,
    getLastMessages: getLastMessages
};