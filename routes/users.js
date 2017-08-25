/**
 * Created by Adonys on 2/1/2017.
 * route
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
    , errors = require('../models/Service/errors');

let validRegisterData = true;
let validLoginData = true;
const constants = constantsVars.constants;
const arts = constantsVars.arts();

//TODO swagger all kind of errors
/**
 * @swagger
 * /api/v1.0/authenticate:
 *   post:
 *      tags:
 *          - Authenticate
 *      description: Authenticate user
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: username
 *            description: User's email.
 *            required: true
 *            in: body
 *            type: string
 *          - name: password
 *            description: User's password.
 *            in: body
 *            required: true
 *            type: string
 *      responses:
 *       200:
 *         description: User object with arts and token
 *         schema:
 *          $ref: '#/definitions/LoginResult'
 */

exports.authenticate = function (req, res, next) {
    const username = _.get(req.body, 'username');
    const password = _.get(req.body, 'password');
    const session = dbNeo4j.getSession(req);

    var errorResponse = validateAuthenticateData(session, username, password);
    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (!validLoginData) {
            console.log("invalid data: " + validLoginData);
            writeResponse.write(res, errorResponse);
        }
        else {
            console.log('going to login.... email: ' + username + " password: " + password);
            users.authenticate(session, username, password).then(function authenticateCallback(response) {
                writeResponse.write(res, response);
            }).catch(function loginError(err) {
                console.log("Error from login route: " + util.inspect(err));
                writeResponse.write(res, errorResponse);
            });
        }
    }
};

/**
 * @swagger
 * definition:
 *  BasicUser:
 *      type: object
 *      properties:
 *          email:
 *              type: string
 *          name:
 *              type: string
 *          art:
 *              type: string
 *              enum: ['0', '1', '2', '3', '4', '5', '6']
 *          password:
 *              type: string
 */

/**
 * @swagger
 * definition:
 *  User:
 *      type: object
 *      properties:
 *          email:
 *              type: string
 *          name:
 *              type: string
 *          avatar:
 *              type: string
 *              format: url
 *          art:
 *              type: string
 *              enum: ['0', '1', '2', '3', '4', '5', '6']
 *          arts:
 *              type: array
 *              items:
 *              enum: ['0', '1', '2', '3', '4', '5', '6']
 */

/**
 * @swagger
 * definition:
 *  LoginResult:
 *      properties:
 *          user:
 *              allOf:
 *                  - $ref: '#/definitions/User'
 *          token:
 *              type: string
 */

/**
 * @swagger
 * /api/v1.0/users:
 *  post:
 *     tags:
 *       - User
 *     description: Create new user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user
 *         description: User data in order to create new one
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/BasicUser'
 *     responses:
 *       201:
 *         description: Return created user
 *         schema:
 *           $ref: '#/definitions/User'
 *       700:
 *           description: Email already registered
 *           message: "email error,  exist"
 *
 *
 *  get:
 *     tags:
 *         - User
 *     description: Get a list of users
 *     produces:
 *         - application/json
 *     parameters:
 *          - name: limit
 *            description: Number of items will be returned
 *            in: query
 *            type: integer
 *            required: false
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
 *     responses:
 *         200:
 *           description: A list of users
 *           schema:
 *              type: array
 *              items:
 *                  $ref: '#/definitions/User'
 *
 *  put:
 *      tags:
 *          - User
 *      description: Update user
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: name
 *            description: New name for user
 *            in: body
 *            required: true
 *            type: string
 *          - name: Authorization
 *            in: header
 *            type: string
 *            required: true
 *            description: Bearer (token goes here)
 *      responses:
 *          200:
 *             description: Return user with name updated
 *             schema:
 *                  $ref: '#/definitions/User'
 *
 */

exports.createUser = function (req, res, next) {
    const email = _.get(req.body, 'email');
    const password = _.get(req.body, 'password');
    const name = _.get(req.body, 'name');
    let art = -1;

    try {
        art = parseInt(_.get(req.body, 'art'));
    }
    catch (err) {
        console.log("art error: " + err);
        writeResponse.write(res, new ErrorResponse(status.UnprocessableEntity, messages.InvalidArt));
    }

    const session = dbNeo4j.getSession(req);
    var errorResponse = validateRegisterData(session, email, password, name, art);

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (!validRegisterData) {
            console.log("entro aqui: " + util.inspect(validRegisterData));
            writeResponse.write(res, errorResponse);
        }
        else {
            users.createUser(session, email, password, name, art).then(function registerCallback(response) {
                writeResponse.write(res, response);
            }).catch(function registerError(err) {
                console.log('Error in routes when creating users: ' + err.message);
                writeResponse.write(errorResponse);
            });
        }
    }

    console.log("validateData: " + util.inspect(validRegisterData));

};

exports.getUsers = function (req, res, next) {
    const session = dbNeo4j.getSession(req);

    let offset = parseInt(_.get(req.query, 'offset'));
    let limit = parseInt(_.get(req.query, 'limit'));

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (isNaN(offset))
            offset = 0;

        if (isNaN(limit))
            limit = constants.GET_USERS_LIMIT;

        users.getUsers(session, offset, limit).then(function usersCallback(response) {
            writeResponse.write(res, response);
        }).catch(function usersError(err) {
            console.log("Route error getting users: " + err.message);
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

exports.updateUser = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const id = req.params.id;
    const name = _.get(req.body, 'name');
    const email = _.get(req.body, 'email');

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (validateData.isUndefined(name) || validateData.isUndefined(email)) {
            writeResponse.write(res, new ErrorResponse(status.BadRequest, ""));
        }
        else if (!validateData.isValidName(name)) {
            writeResponse.write(res, new ErrorResponse(status.UnprocessableEntity, messages.InvalidName));
        }
        else if (!validateData.isValidEmail(email)) {
            console.log('invalid email: ' + messages.InvalidEmail);
            writeResponse.write(res, new ErrorResponse(status.UnprocessableEntity, messages.InvalidEmail));
        }
        else {
            users.updateUser(session, id, name, email).then(function updateUserResponse(response) {
                writeResponse.write(res, response);
            }).catch(function updateUserError(err) {
                console.log("Error updating user: " + util.inspect(err));
                writeResponse.write(res, errors.InternalErrorResponse());
            });
        }
    }
};

/**
 * @swagger
 * /api/v1.0/users/:id:
 *  get:
 *      tags:
 *          - User
 *      description: Return user by id
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: id
 *            description: User's id
 *            in: path
 *            required: true
 *            type: string
 *          - name: Authorization
 *            in: header
 *            type: string
 *            required: true
 *            description: Bearer (token goes here)
 *      responses:
 *          200:
 *             description: Return user with given id
 *             schema:
 *                  $ref: '#/definitions/User'
 */

exports.findUserById = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const id = req.params.id;
    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        users.findUserById(session, id).then(function userByIdCallback(response) {
            writeResponse.write(res, response);
        }).catch(function userByIdError(err) {
            next(err);
        });
    }
};

/**
 * @swagger
 * /api/v1.0/users/find/:field:
 *  get:
 *      tags:
 *          - User
 *      description: Return user by name or email, and can specifying an art
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: field
 *            description: This field can be a name or email
 *            in: path
 *            required: true
 *            type: string
 *          - name: art
 *            description: On value of ArtKeys
 *            in: query
 *            type: integer
 *            required: false
 *            enum: [0, 1, 2, 3, 4, 5, 6]
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
 *
 *      responses:
 *          200:
 *             description: Returned user with given name or email and belong to defined art
 *             schema:
 *                  type: array
 *                  items:
 *                      $ref: '#/definitions/User'
 */

exports.findUsers = function (req, res, next) {
    let session = dbNeo4j.getSession(req);
    let offset = parseInt(_.get(req.query, 'offset'));
    let limit = parseInt(_.get(req.query, 'limit'));
    const id = req.user['id'];
    const field = req.params.field;
    let art_param = parseInt(_.get(req.query, 'art'));
    let art = "";

    if (!isNaN(art_param) && validateData.isValidArtValue(art_param)) {
        art = arts[art_param];
        console.log("art name: " + art);
    }

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (isNaN(offset))
            offset = 0;
        if (isNaN(limit) || limit > constants.GET_USERS_LIMIT)
            limit = constants.GET_USERS_LIMIT;

        if (!validateData.isUndefined(field) && field.length >= constants.MIN_LENGH_FIELD_SEARCH) {
            users.findUsers(session, id, field, art, offset, limit).then(function findUsersCallback(response) {
                writeResponse.write(res, response);
            }).catch(function findUsersError(err) {
                console.log("Route error getting users: " + util.inspect(err));
                writeResponse.write(res, errors.InternalErrorResponse());
            });
        } else {
            writeResponse.write(res, new ErrorResponse(status.BadRequest, ""));
        }
    }
};

/**
 * @swagger
 * /api/v1.0/users/find-by-name/:name:
 *  get:
 *      tags:
 *          - User
 *      description: Return user by name
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: name
 *            description: User's name
 *            in: path
 *            required: true
 *            type: string
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
 *             description: Returned user with given name
 *             schema:
 *                  type: array
 *                  items:
 *                      $ref: '#/definitions/User'
 */

exports.findUsersByName = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    let offset = parseInt(_.get(req.query, 'offset'));
    let limit = parseInt(_.get(req.query, 'limit'));
    const name = req.params.name;

    console.log("routing finding user by " + name);

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (isNaN(offset))
            offset = 0;
        if (isNaN(limit) || limit > constants.GET_USERS_LIMIT)
            limit = constants.GET_USERS_LIMIT;

        if (!validateData.isUndefined(name) && name.length >= constants.MIN_LENGH_FIELD_SEARCH) {
            console.log("entering finding: " + name);
            users.findUsersByName(session, offset, limit, name).then(function usersByNameCallback(response) {
                writeResponse.write(res, response);
            }).catch(function usersByNameError(err) {
                console.log("Route error getting users: " + util.inspect(err));
                next();
            });
        } else {
            writeResponse.write(res, new ErrorResponse(status.BadRequest, ""));
        }
    }
};

/**
 * @swagger
 * /api/v1.0/users/find-by-email/:email:
 *  get:
 *      tags:
 *          - User
 *      description: Return user by email
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: email
 *            description: User's email
 *            in: path
 *            required: true
 *            type: string
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
 *             description: Returned user with given email
 *             schema:
 *                  type: array
 *                  items:
 *                      $ref: '#/definitions/User'
 */

exports.findUsersByEmail = function (req, res, next) {
    console.log("routing by name");

    const session = dbNeo4j.getSession(req);
    let offset = parseInt(_.get(req.query, 'offset'));
    let limit = parseInt(_.get(req.query, 'limit'));
    const email = req.params.email;

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (isNaN(offset))
            offset = 0;
        if (isNaN(limit) || limit > constants.GET_USERS_LIMIT)
            limit = constants.GET_USERS_LIMIT;

        if (!validateData.isUndefined(email) && email.length >= constants.MIN_LENGH_FIELD_SEARCH) {
            users.findUsersByEmail(session, offset, limit, email).then(function usersByEmailCallback(response) {
                writeResponse.write(res, response);
            }).catch(function usersByEmailError(err) {
                writeResponse.write(res, errors.InternalErrorResponse);
                //next();
            });
        }
        else {
            writeResponse.write(res, new ErrorResponse(status.BadRequest, ""));
        }
    }
};


/**
 * @swagger
 * definition:
 *  ArtKeys:
 *      properties:
 *          art:
 *              description: Key for Art Value or Art Name. 0 - Paint, 4 - Literature
 *              type: integer
 *              enum: [0, 1, 2, 3, 4, 5, 6]
 */

/**
 * @swagger
 * definition:
 *  ArtValues:
 *      properties:
 *          art:
 *              type: string
 *              enum: ['Paint', 'Music', 'Sculpture', 'Architecture', 'Literature', 'Dance', 'Cinema']
 *              example: 0 - Paint, Sculpture - 2
 *              description: Arts name than match with artkeys
 */

/**
 * @swagger
 * definition:
 *  ArtsResult:
 *      properties:
 *          art:
 *              type: integer
 *              enum: [0, 1, 2, 3, 4, 5, 6]
 *              description: Main Art of the user - he belong to this art, it was chosen
 *          arts:
 *              description: Array of art keys, each key will be different of Main Art
 *              type: array
 *              enum: [0, 1, 2, 3, 4, 5, 6]
 */

/**
 * @swagger
 * /api/v1.0/users/:id/arts:
 *  post:
 *      tags:
 *          - User Arts
 *      description: Add arts to user
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: id
 *            description: User's id
 *            required: true
 *            in: path
 *            type: string
 *          - name: arts
 *            description: Array with keys of arts will be added. Not include user main art
 *            type: array
 *            in: body
 *            required: true
 *            items:
 *              enum: [0, 1, 2, 3, 4, 5, 6]
 *          - name: Authorization
 *            description: Bearer (here goes token)
 *            type: string
 *            in: header
 *            required: true
 *
 *      responses:
 *              200:
 *                  description: ArtsResult
 *                  schema:
 *                      $ref: '#/definitions/ArtsResult'
 *
 *  get:
 *      tags:
 *          - User Arts
 *      description: Get arts from user with id
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: id
 *            description: User's id
 *            required: true
 *            in: path
 *            type: string
 *          - name: Authorization
 *            description: Bearer (here goes token)
 *            type: string
 *            in: header
 *            required: true
 *      responses:
 *           200:
 *              description: User's arts,
 *              schema:
 *                  $ref: '#/definitions/ArtsResult'
 *
 *  delete:
 *      tags:
 *          - User Arts
 *      description: Delete arts that user has
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: id
 *            description: User's id
 *            required: true
 *            in: path
 *            type: string
 *          - name: arts
 *            description: Array with keys of arts will be deleted. Not include user main art
 *            type: array
 *            in: query
 *            required: true
 *            items:
 *                  enum: [0, 1, 2, 3, 4, 5, 6]
 *          - name: Authorization
 *            description: Bearer (here goes token)
 *            type: string
 *            in: header
 *            required: true
 *      responses:
 *              200:
 *                  description: User's arts
 *                  schema:
 *                      $ref: '#/definitions/ArtsResult'
 */

//TODO put arts in other file
exports.getArts = function (req, res, next) {
    let session = dbNeo4j.getSession(req);
    const id = req.params.id;

    if (validateData.isUndefined(session))
        writeResponse.write(res, errors.InternalErrorResponse());
    else if (validateData.isUndefined(id))
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    else {
        users.getArts(session, id).then(function getArtsCallback(response) {
            writeResponse.write(res, response);
        }).catch(function getArtsError(err) {
            console.log("routing error getting arts: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

exports.addArtsToUser = function (req, res, next) {
    let session = dbNeo4j.getSession(req);
    const artsValues = _.get(req.body, 'arts').split(',');
    const id = req.user['id'];
    const user_id = req.params.id;

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else if (validateData.isUndefined(artsValues) || artsValues.length <= 0 || validateData.isUndefined(user_id)) {
        writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else if (validateData.isUndefined(id) || id != user_id) {
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    }
    else {
        users.addArtsToUser(session, user_id, artsValues).then(function addArtsCallback(response) {
            console.log(response);
            writeResponse.write(res, response);
        }).catch(function addArtsError(err) {
            console.log("routing error adding arts: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse);
        });
    }
};

exports.deleteArtsFromUser = function (req, res, next) {
    let session = dbNeo4j.getSession(req);
    const artsValues = _.get(req.body, 'arts').split(',');
    const id = req.user['id'];
    const user_id = req.params.id;

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else if (validateData.isUndefined(artsValues) || artsValues.length <= 0 || validateData.isUndefined(user_id)) {
        writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else if (validateData.isUndefined(id) || id != user_id) {
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    }
    else {
        users.deleteArtsFromUser(session, user_id, artsValues).then(function deleteArtsFromUserCallback(response) {
            writeResponse.write(res, new Response(status.Ok, response));
        }).catch(function deleteArtsFromUserError(err) {
            console.log("routing error deleting arts: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse);
        });
    }
};

/**
 * @swagger
 * definition:
 *  Partner:
 *      properties:
 *          user:
 *              type: object
 *              $ref: '#/definitions/User'
 *          partners_count:
 *              type: integer
 *          common_arts_count:
 *              type: integer
 *          common_partners_count:
 *              type: integer
 *          partner_status:
 *              type: integer
 *          invitation_sent:
 *              type: boolean
 *
 */

/**
 * @swagger
 * /api/v1.0/users/:id/partners:
 *  get:
 *      tags:
 *          - User
 *      description: Get a list of partners from de user with id
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: id
 *            description: User's id
 *            in: path
 *            type: string
 *            required: true
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
 *            example: Bearer eyJhbGciOiJIUzI1NiIsInR5c
 *
 *      responses:
 *          200:
 *              description: Return list of partners users
 *              schema:
 *                  type: array
 *                  items:
 *                      $ref: '#/definitions/Partner'
 */

exports.getPartners = function (req, res, next, websocket) {
    const session = dbNeo4j.getSession(req);

    const id = req.user['id'];
    const user_id = req.params.id;

    var offset = parseInt(_.get(req.query, 'offset'));
    var limit = parseInt(_.get(req.query, 'limit'));

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else if (validateData.isUndefined(id)) {
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    }
    else if (validateData.isUndefined(user_id)) {
            writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else {
        if (isNaN(offset))
            offset = 0;

        if (isNaN(limit))
            limit = constants.GET_USERS_LIMIT;

        users.getPartners(session, id, user_id, limit, offset).then(function getResultsCallback(response) {
            writeResponse.write(res, response);
        }).catch(function getPartnersError(err) {
            console.log("route error get partners: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

//TODO valid email reg expression implements
const validateRegisterData = function (session, email, password, name, art) {
    var errorResponse = new ErrorResponse(status.InternalError, messages.InternalServerError);
    if (!validateData.findUndefined([session, email, password, name, art])) {
        if (!validateData.isValidEmail(email)) {
            errorResponse = new ErrorResponse(status.UnprocessableEntity, messages.InvalidEmail);
            validRegisterData = false;
        } else if (!validateData.isValidPassword(password)) {
            errorResponse = new ErrorResponse(status.UnprocessableEntity, messages.InvalidPassword);
            validRegisterData = false;
        } else if (!validateData.isValidName(name)) {
            console.log("name error");
            errorResponse = new ErrorResponse(status.UnprocessableEntity, messages.InvalidName);
            validRegisterData = false;
        }
        else if (isNaN(art) || art < 0 || art >= arts.length) {
            console.log("art error: " + art);
            errorResponse = new ErrorResponse(status.UnprocessableEntity, messages.InvalidArt);
            validRegisterData = false;
        }
    }
    else {
        errorResponse = new ErrorResponse(status.BadRequest, "");
        validRegisterData = false;
    }

    return errorResponse;
};

//TODO valid email
function validateAuthenticateData(session, username, password) {
    var errorResponse = new ErrorResponse(status.InternalError, messages.InternalError);
    if (!validateData.findUndefined([session, username, password])) {
        if (!validateData.isValidEmail(username)) {
            console.log("login email error");
            errorResponse = new ErrorResponse(status.UnprocessableEntity, messages.InvalidEmail);
            validLoginData = false;
        } else if (!validateData.isValidPassword(password)) {
            console.log("login password error");
            errorResponse = new ErrorResponse(status.UnprocessableEntity, messages.InvalidPassword);
            validLoginData = false;
        }
    }
    else {
        console.log("bad request");
        errorResponse = new ErrorResponse(status.BadRequest, "");
        validLoginData = false;
    }

    return errorResponse;
}
