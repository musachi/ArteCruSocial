/**
 * Created by Adonys on 5/18/2017.
 */



var dbNeo4j = require('../neo4j/db-neo4j')
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
    , invitations = require('../models/Invitation/invitations')
    , invitationStatus = require('../models/Service/invitation-status')
    , profiles = require('../models/Profile/personal-profile');


/**
 * @swagger
 * definition:
 *  PersonalProfile:
 *      description: Personal profile of user
 *      properties:
 *          name:
 *              description: User's name.
 *              type: string
 *          birthday:
 *              description:  User birth date.
 *              type: string
 *          gender:
 *              description: if user is Male or Female
 *              type: integer
 *          phone:
 *              description: User phone number
 *              type: string
 *          website:
 *              description: user web site
 *              type: string
 *
 *
 */

/**
 * @swagger
 * /api/v1.0/users/:id/profile/personal:
 *  get:
 *      tags:
 *         - Personal Profile
 *      description: Get personal profile from user with id value
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: id
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
 *              description: Return user personal profile
 *              schema:
 *                  $ref: '#/definitions/PersonalProfile'
 *
 */

/**
 * @swagger
 * /api/v1.0/profile/personal:
 *  get:
 *      tags:
 *         - Personal Profile
 *      description: Get personal profile of logged user
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
 *              description: Return user personal profile
 *              schema:
 *                  $ref: '#/definitions/PersonalProfile'
 *
 *
 *  put:
 *      tags:
 *          - Personal Profile
 *      description: Update logged user personal profile
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: personalProfile
 *            in: body
 *            required: true
 *            type: object
 *            schema:
 *              $ref: '#/definitions/PersonalProfile'
 *          - name: Authorization
 *            in: header
 *            type: string
 *            required: true
 *            description: Bearer (token goes here)
 *      responses:
 *          200:
 *              description: Return user personal profile
 *              schema:
 *                  $ref: '#/definitions/PersonalProfile'
 *
 */

exports.getPersonalProfile = function (req, res, next) {
    let session = dbNeo4j.getSession(req);
    let id = req.user['id'];
    const user_id = req.params.id;

    if (!validateData.isUndefined(user_id))
        id = user_id;

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else if (validateData.isUndefined(id)) {
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    }
    else {
        profiles.getPersonalProfile(session, id).then(function getPersonalProfileCallback(response) {
            writeResponse.write(res, new Response(status.Ok, response));
        }).catch(function getPersonalInfoError(err) {
            console.log("route error getting personal info: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

//TODO validate birthday, website, name, phone, and gender
exports.updatePersonalProfile = function (req, res, next) {
    let session = dbNeo4j.getSession(req);
    const id = req.user['id'];
    const name = _.get(req.body, 'name');
    const website = _.get(req.body, 'website');
    const gender = _.get(req.body, 'gender');
    const phone = _.get(req.body, 'phone');
    const birthday = _.get(req.body, 'birthday');
    let user_id = req.params.id;

    if (validateData.isUndefined(user_id))
        user_id = id;

    console.log("data: " + name + " " + website + " " + gender + " " + phone + " " + birthday);

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else if (validateData.findUndefined([name, website, gender, phone, birthday, user_id])) {
        writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else if (validateData.isUndefined(id) || id != user_id) {
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    }
    else {
        profiles.updatePersonalProfile(session, id, name, website, gender, phone, birthday)
            .then(function updatePersonalProfileCallback(response) {
                writeResponse.write(res, new Response(status.Ok, response));
            }).catch(function updatePersonalProfileError(err) {
            console.log("route error updating personal profile: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

