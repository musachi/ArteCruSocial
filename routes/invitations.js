/**
 * Created by Adonys on 5/18/2017.
 */

const dbNeo4j = require('../neo4j/db-neo4j')
    , users = require('../models/User/users')
    , _ = require('lodash')
    , status = require('../models/Service/status')
    , validateData = require('../helpers/validate-data')
    , constantsVars = require('../helpers/contants')
    , User = require('../models/neo4j_model/user')
    , Response = require('../models/Service/response')
    , writeResponse = require('../helpers/write-response')
    , messages = require('../helpers/messages').messages
    , util = require('util')
    , errors = require('../models/Service/errors')
    , invitations = require('../models/Invitation/invitations')
    , invitationStatus = require('../models/Service/invitation-status')
    , constants = constantsVars.constants;

/**
 * @swagger
 * definition:
 *  Invitation:
 *      type: object
 *      description: Partner invitation sended from one user to other.
 *      properties:
 *          created_at:
 *              description: Date when partner invitation was sended. Format (milliseconds)
 *              type: string
 *          updated_at:
 *              description: Date when invitation status was changed (accepted). Format (milliseconds)
 *              type: string
 *          status:
 *              description: Partner invitation status. 0 -> waiting for accept or cancel, 1-> accepted partner invitation
 *              type: integer
 *              enum: [0, 1]
 *          user_id:
 *              description: User than send the invitation
 *              type: string
 *
 */

/**
 * @swagger
 * definition:
 *  InvitationResponse:
 *      type: object
 *      description: Invitation sended from one user to other.
 *      properties:
 *          created_at:
 *              description: Date when invitation was sended. Format (milliseconds)
 *              type: string
 *          updated_at:
 *              description: Date when invitation status was changed (accepted). Format (milliseconds)
 *              type: string
 *          status:
 *              description: Invitation status
 *              type: integer
 *              enum: [0, 1]
 *          user:
 *              description: User than send the invitation
 *              type: object
 *              $ref: '#/definitions/User'
 *
 */

/**
 * @swagger
 * /api/v1.0/invitations:
 *  post:
 *      tags:
 *         - Invitation
 *      description: Send partner invitation to another user
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: user_id
 *            in: body
 *            type: string
 *            required: true
 *            description: User's id will receive the invitation
 *          - name: Authorization
 *            in: header
 *            type: string
 *            required: true
 *            description: Bearer (token goes here)
 *      responses:
 *          201:
 *              description: Invitation sended to a partner, he will be notified
 *              schema:
 *                  $ref: '#/definitions/Invitation'
 *
 *  get:
 *      tags:
 *          - Invitation
 *      description: Get invitations received
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: limit
 *            description: Number of items will be returned
 *            in: query
 *            required: false
 *            type: integer
 *            maximum: 20
 *          - name: offset
 *            description: Number of items will be ignored
 *            in: query
 *            required: false
 *            type: string
 *            minimum: 0
 *          - name: Authorization
 *            in: header
 *            type: string
 *            required: true
 *            description: Bearer (token goes here)
 *      responses:
 *          200:
 *              description: Return invitations received
 *              type: array
 *              items:
 *                  $ref: '#/definitions/InvitationResponse'
 *
 *
 */

exports.sendInvitation = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const user_id = _.get(req.body, 'user_id');
    const current_user_id = req.user['id'];
    console.log("user_id: " + user_id);

    if (validateData.isUndefined(user_id) || validateData.isUndefined(current_user_id) || user_id == current_user_id)
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        invitations.sendInvitation(session, current_user_id, user_id).then(function partnerInvitationCallback(response) {
            writeResponse.write(res, new Response(status.Created, response));
        }).catch(function partnerInvitationError(err) {
            console.log("Error inviting user: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

exports.getInvitations = function (req, res, next) {

    const session = dbNeo4j.getSession(req);
    let offset = parseInt(_.get(req.query, 'offset'));
    let limit = parseInt(_.get(req.query, 'limit'));
    const id = req.user['id'];

    if (validateData.isUndefined(id))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else if (validateData.isUndefined(session)) {
        console.log("getting users session null");
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else {
        if (isNaN(offset) || isNaN(limit)) {
            offset = 0;
            limit = constants.GET_USERS_LIMIT;
        }
        invitations.getInvitations(session, offset, limit, id).then(function invitationsCallback(response) {
            writeResponse.write(res, new Response(status.Ok, response));
        }).catch(function () {
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

/**
 * @swagger
 * /api/v1.0/invitations/:user_id:
 *  get:
 *      tags:
 *         - Invitation
 *      description: get invitation between logged User and User with 'user_id'
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: user_id
 *            in: path
 *            type: string
 *            required: true
 *            description: User's id
 *          - name: Authorization
 *            in: header
 *            type: string
 *            required: true
 *            description: Bearer (token goes here)
 *      responses:
 *          200:
 *              description: Return relationship status with the other user (invitation)
 *              schema:
 *                  $ref: '#/definitions/Invitation'
 *
 *  put:
 *      tags:
 *          - Invitation
 *      description: Change invitation status, accept invitation
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: user_id
 *            description: User's id sent partner invitation
 *            in: path
 *            required: true
 *            type: string
 *          - name: Authorization
 *            in: header
 *            required: true
 *            type: string
 *            description: Bearer (token goes here)
 *      responses:
 *          200:
 *              description: Accept invitation
 *              schema:
 *                  $ref: '#/definitions/Invitation'
 *
 *  delete:
 *      tags:
 *          - Invitation
 *      description: Denied, cancel invitation or delete relationship with another user. Denied if received, cancel if sended, or delete if are partners
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: user_id
 *            description: User's id sent or received partner invitation
 *            in: path
 *            required: true
 *            type: string
 *          - name: Authorization
 *            in: header
 *            required: true
 *            type: string
 *            description: Bearer (token goes here)
 *      responses:
 *          200:
 *              description: Delete relationship of partner or invitations with the other user
 *              type: boolean
 *
 */

exports.acceptInvitation = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const current_user_id = req.user['id'];
    const user_id = req.params.user_id;

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else if (validateData.isUndefined(current_user_id) || validateData.isUndefined(user_id)) {
        writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else {
        invitations.acceptInvitation(session, current_user_id, user_id).then(function acceptInvitationCallback(response) {
            writeResponse.write(res, new Response(status.Ok, response));
        }).catch(function acceptInvitationError(err) {
            console.log("route accept invitation error: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse);
        });
    }
};

exports.deleteInvitation = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const current_user_id = req.user['id'];
    const user_id = req.params.user_id;

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else if (validateData.isUndefined(current_user_id) || validateData.isUndefined(user_id)) {
        writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else {
        invitations.deleteInvitation(session, current_user_id, user_id).then(function deniedInvitationCallback(response) {
            writeResponse.write(res, new Response(status.Ok, response));
        }).catch(function deniedInvitationError(err) {
            console.log("route accept invitation error: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse);
        });
    }
};

exports.findInvitationById = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const current_user_id = req.user['id'];
    const user_id = req.params.user_id;

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else if (validateData.isUndefined(current_user_id) || validateData.isUndefined(user_id) || current_user_id == user_id) {
        writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else {
        invitations.findInvitationById(session, current_user_id, user_id).then(function findInvitationCallback() {

        }).catch(function findInvitationError(err) {
            console.log("route error finding invitation: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

/**
 * @swagger
 * /api/v1.0/invitations/count:
 *  get:
 *      tags:
 *         - Invitation
 *      description: Total invitations counter
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: Authorization
 *            in: header
 *            type: string
 *            required: true
 *            description: Bearer (token goes here)
 *      responses:
 *          200:
 *              description: Return the number of invitations received
 *              type: integer
 *
 */

exports.countInvitations = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const current_user_id = req.user['id'];
    if (validateData.isUndefined(current_user_id))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else {
        invitations.countInvitations(session, current_user_id).then(function countInvitationsCallback(response) {
            console.log("route response come back: " + response);
            writeResponse.write(res, new Response(status.Ok, response));
        }).catch(function countErrorResponse(err) {
            console.log(err);
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

exports.getInvitationsSent = function (req, res, next) {

    const session = dbNeo4j.getSession(req);
    var offset = parseInt(_.get(req.query, 'offset'));
    var limit = parseInt(_.get(req.query, 'limit'));
    const current_user_id = req.user['id'];

    if (validateData.isUndefined(current_user_id))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else if (validateData.isUndefined(session)) {
        console.log("getting users session null");
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else {
        if (isNaN(offset) || isNaN(limit)) {
            offset = 0;
            limit = constants.GET_USERS_LIMIT;
        }
        invitations.getInvitationsSent(session, offset, limit, current_user_id).then(function invitationsCallback(response) {
            writeResponse.write(res, new Response(status.Ok, response));
        }).catch(function () {
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

exports.countInvitationsSent = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const current_user_id = req.user['id'];

    if (validateData.isUndefined(current_user_id))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else {
        invitations.countInvitationsSent(session, current_user_id).then(function countInvitationsCallback(response) {
            writeResponse.write(res, new Response(status.Ok, response));
        }).catch(function countErrorResponse(err) {
            console.log(err);
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};





