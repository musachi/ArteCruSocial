/**
 * Created by Adonys on 2/1/2017.
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
    , errors = require('../models/Service/errors');

var validRegisterData = true;
var validLoginData = true;
var constants = constantsVars.constants;
var arts = constantsVars.arts();

exports.createUser = function (req, res, next) {
    var email = _.get(req.body, 'email');
    var password = _.get(req.body, 'password');
    var name = _.get(req.body, 'name');
    var art = -1;

    try {
        art = parseInt(_.get(req.body, 'art'));
    }
    catch (err) {
        console.log("art error: " + err);
        writeResponse.write(res, new ErrorResponse(status.UnprocessableEntity, status.InvalidArt, messages.InvalidArt));
    }

    var session = dbNeo4j.getSession(req);
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

exports.authenticate = function (req, res, next) {
    var username = _.get(req.body, 'username');
    var password = _.get(req.body, 'password');
    var session = dbNeo4j.getSession(req);

    var errorResponse = validateAuthenticateData(session, username, password);
    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (!validLoginData) {
            console.log("invalid data");
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

exports.getUsers = function (req, res, next) {
    var session = dbNeo4j.getSession(req);

    var offset = parseInt(_.get(req.query, 'offset'));
    var limit = parseInt(_.get(req.query, 'limit'));

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (isNaN(offset) || isNaN(limit)) {
            offset = 0;
            limit = constants.GET_USERS_COUNTER;
        }

        users.getUsers(session, offset, limit).then(function usersCallback(response) {
            writeResponse.write(res, response);
        }).catch(function usersError(err) {
            console.log("Route error getting users: " + err.message);
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

exports.updateUser = function (req, res, next) {
    var session = dbNeo4j.getSession(req);
    var id = req.params.id;
    var name = _.get(req.body, 'name');
    var email = _.get(req.body, 'email');

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (validateData.isUndefined(name) || validateData.isUndefined(email)) {
            writeResponse.write(res, new ErrorResponse(status.BadRequest, "", ""));
        }
        else if (!validateData.isValidName(name)) {
            writeResponse.write(res, new ErrorResponse(status.UnprocessableEntity, status.InvalidName, messages.InvalidName));
        }
        else if (!validateData.isValidEmail(email)) {
            console.log('invalid email: ' + messages.InvalidEmail);
            writeResponse.write(res, new ErrorResponse(status.UnprocessableEntity, status.InvalidEmail, messages.InvalidEmail));
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

exports.addArtsToUser = function (req, res, next) {
    let session = dbNeo4j.getSession(req);
    const artsValues = _.get(req.body, 'arts').split(',');
    const id = req.user['id'];
    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else if (validateData.isUndefined(artsValues) || artsValues.length <= 0) {
        writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else if (validateData.isUndefined(id)) {
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    }
    else {
        users.addArtsToUser(session, id, artsValues).then(function addArtsCallback(response) {
            console.log(response);
            writeResponse.write(res, response);
        }).catch(function addArtsError(err) {
            console.log("routing error adding arts: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse);
        });
    }
};

exports.getArts = function (req, res, next) {
    let session = dbNeo4j.getSession(req);
    const id = req.user['id'];

    if (validateData.isUndefined(session))
        writeResponse.write(res, errors.InternalErrorResponse());
    else if (validateData.isUndefined(id))
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    else {
        users.getArts(session, id).then(function getArtsCallback(response){
            writeResponse.write(res, response);
        }).catch(function getArtsError(err){
            console.log("routing error getting arts: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

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
        if (isNaN(limit) || limit > constants.GET_USERS_COUNTER)
            limit = constants.GET_USERS_COUNTER;

        if (!validateData.isUndefined(field)) {
            users.findUsers(session, id, field, art, offset, limit).then(function findUsersCallback(response) {
                writeResponse.write(res, response);
            }).catch(function findUsersError(err) {
                console.log("Route error getting users: " + util.inspect(err));
                writeResponse.write(res, errors.InternalErrorResponse());
            });
        } else {
            writeResponse.write(res, new ErrorResponse(status.BadRequest, "", ""));
        }
    }
};

exports.findUsersByName = function (req, res, next) {
    var session = dbNeo4j.getSession(req);
    var offset = parseInt(_.get(req.query, 'offset'));
    var limit = parseInt(_.get(req.query, 'limit'));
    const name = req.params.name;

    console.log("routing finding user by " + name);

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (isNaN(offset))
            offset = 0;
        if (isNaN(limit) || limit > constants.GET_USERS_COUNTER)
            limit = constants.GET_USERS_COUNTER;

        if (!validateData.isUndefined(name)) {
            console.log("entering finding: " + name);
            users.findUsersByName(session, offset, limit, name).then(function usersByNameCallback(response) {
                writeResponse.write(res, response);
            }).catch(function usersByNameError(err) {
                console.log("Route error getting users: " + util.inspect(err));
                next();
            });
        } else {
            writeResponse.write(res, new ErrorResponse(status.BadRequest, "", ""));
        }
    }
};

exports.findUsersByEmail = function (req, res, next) {
    console.log("routing by name");

    var session = dbNeo4j.getSession(req);
    var offset = parseInt(_.get(req.query, 'offset'));
    var limit = parseInt(_.get(req.query, 'limit'));
    const email = req.params.email;

    if (validateData.isUndefined(session)) {
        writeResponse.write(res, errors.InternalErrorResponse());
    } else {
        if (isNaN(offset))
            offset = 0;
        if (isNaN(limit) || limit > constants.GET_USERS_COUNTER)
            limit = constants.GET_USERS_COUNTER;

        if (!validateData.isUndefined(email)) {
            users.findUsersByEmail(session, offset, limit, email).then(function usersByEmailCallback(response) {
                writeResponse.write(res, response);
            }).catch(function usersByEmailError(err) {
                console.log("Route error getting users: " + err.message);
                next();
            });
        }
        else {
            writeResponse.write(res, new ErrorResponse(status.BadRequest, "", ""));
        }
    }
};

exports.findUserById = function (req, res, next) {
    var session = dbNeo4j.getSession(req);
    var id = req.params.id;
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

exports.getPartners = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const id = req.user['id'];
    const user_id = req.params.id;

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
        users.getPartners(session, id, user_id).then(function getResultsCallback(response) {
            writeResponse.write(res, response);
        }).catch(function getPartnersError(err) {
            console.log("route error get partners: " + util.inspect(err));
            writeResponse.write(res, errors.InternalErrorResponse());
        });
    }
};

//TODO valid email reg expression implements
var validateRegisterData = function (session, email, password, name, art) {
    var errorResponse = new ErrorResponse(status.InternalError, status.InternalErrorCode, messages.InternalServerError);
    if (!validateData.findUndefined([session, email, password, name, art])) {
        if (!validateData.isValidEmail(email)) {
            errorResponse = new ErrorResponse(status.UnprocessableEntity, status.InvalidEmail, messages.InvalidEmail);
            validRegisterData = false;
        } else if (!validateData.isValidPassword(password)) {
            errorResponse = new ErrorResponse(status.UnprocessableEntity, status.InvalidPassowrd, messages.InvalidPassword);
            validRegisterData = false;
        } else if (!validateData.isValidName(name)) {
            console.log("name error");
            errorResponse = new ErrorResponse(status.UnprocessableEntity, status.InvalidName, messages.InvalidName);
            validRegisterData = false;
        }
        else if (isNaN(art) || art < 0 || art >= arts.length) {
            console.log("art error: " + art);
            errorResponse = new ErrorResponse(status.UnprocessableEntity, status.InvalidArt, messages.InvalidArt);
            validRegisterData = false;
        }
    }
    else {
        errorResponse = new ErrorResponse(status.BadRequest, "", "");
        validRegisterData = false;
    }

    return errorResponse;
};

//TODO valid email
function validateAuthenticateData(session, username, password) {
    var errorResponse = new ErrorResponse(status.InternalError, status.InternalErrorCode, messages.InternalError);
    if (!validateData.findUndefined([session, username, password])) {
        if (!validateData.isValidEmail(username)) {
            console.log("login email error");
            errorResponse = new ErrorResponse(status.UnprocessableEntity, status.InvalidEmail, messages.InvalidEmail);
            validLoginData = false;
        } else if (!validateData.isValidPassword(password)) {
            console.log("login password error");
            errorResponse = new ErrorResponse(status.UnprocessableEntity, status.InvalidPassowrd, messages.InvalidPassword);
            validLoginData = false;
        }
    }
    else {
        console.log("bad request");
        errorResponse = new ErrorResponse(status.BadRequest, "", "");
        validLoginData = false;
    }

    return errorResponse;
}






