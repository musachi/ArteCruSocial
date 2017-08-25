/**
 * messages route
 */

const uploads = require('../models/Uploads/uploads');
const ErrorResponse = require('../models/Service/error-response');
const writeResponse = require('../helpers/write-response')
    , messages = require('../helpers/messages').messages
    , util = require('util');
const status = require('../models/Service/status');
const dbpg = require('../pg/db-pg');
const _ = require('lodash');
const validateData = require('../helpers/validate-data');
const errors = require('../models/Service/errors');
const dbNeo4j = require('../neo4j/db-neo4j');
const dateHelper = require('../helpers/date-helper');
const Message = require('../models/Message/message-model');
const chatMessage = require('../models/Message/messages');
const messageType = require('../helpers/contants').message_type;
const Response = require('../models/Service/response');

//TODO send message for group
// TODO check type of message and type of data
//TODO check if owner equal to id in token
exports.sendMessage = function (req, res, next) {
    const pgpClient = dbpg.getPgpClient(req);
    const owner_user_id = _.get(req.body, 'owner_user_id');
    const target_id = _.get(req.body, 'target_id');
    const text = _.get(req.body, 'text');
    const attachment_id = _.get(req.body, 'attachment_id');
    const type = _.get(req.body, 'type');
    const location = _.get(req.body, 'location');

    console.log("owner user id: " + owner_user_id);
    console.log("target id: " + target_id);
    console.log("text: " + text);

    if (!pgpClient || validateData.isUndefined(pgpClient))
        writeResponse.write(res, errors.InternalErrorResponse());
    else if (validateData.findUndefined([owner_user_id, target_id, type])
        || (type != messageType.text && type != messageType.attachment && type != messageType.location)) {
        console.log("type error: " + type);
        writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else {
        const message = new Message(owner_user_id, target_id, type, null, text, attachment_id, location);
        chatMessage.sendMessage(pgpClient, message)
            .then(function sendMessageCallback(response) {
                writeResponse.write(res, response);
            }).catch(function sendMessageError(err) {
            console.log("error model sending message: " + util.inspect(err));
            writeResponse.write(errors.InternalErrorResponse());
        });
    }
};

//TODO constants limit and offset, pass user id like param and check if is the same than token bring
//TODO implement optimizar las busquedas con index and use last index
exports.getLastMessages = function (req, res, next) {
    const pgpClient = dbpg.getPgpClient(req);
    let limit = _.get(req.body, 'limit');
    let offset = _.get(req.body, 'offset');
    const user_id = req.user['id'];

    if (!offset || validateData.isUndefined(offset))
        offset = 0;
    if (!limit || validateData.isUndefined(limit))
        limit = 10;

    chatMessage.getLastMessages(pgpClient, user_id, offset, limit)
        .then(function getMessagesResponse(response) {
            console.log("response: " + util.inspect(response));
            writeResponse.write(res, new Response(status.Ok, response));
        })
        .catch(function getMessagesError() {
            writeResponse.write(res, errors.InternalErrorResponse());
        });
};