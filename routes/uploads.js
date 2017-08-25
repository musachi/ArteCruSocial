/**
 * route uploads
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

exports.uploadAvatar = function (req, res, next) {
    const pgpClient = dbpg.getPgpClient(req);
    const session = dbNeo4j.getSession(req);
    const currentId = req.user['id'];
    console.log("Entering routing");
    if (validateData.isUndefined([currentId, session, pgpClient]))
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    else
        uploads.uploadAvatar(session, req, res, pgpClient, currentId, function uploadingAvatarCallback(response) {
            writeResponse.write(res, response);
        });
};

//TODO pass message attachment, u must select file
exports.uploadImages = function (req, res, next) {
    const pgpClient = dbpg.getPgpClient(req);
    const currentId = req.user['id'];
    if(req.headers['content-length'] == '0')
        writeResponse.write(res, errors.BadRequestErrorResponse());
    if (validateData.isUndefined(currentId))
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    else
        uploads.uploadImages(req, res, pgpClient, currentId, function uploadingAvatarCallback(response) {
            writeResponse.write(res, response);
        });
};

exports.docs = function (req, res, next) {

};



