/**
 * Created by Adonys on 2/1/2017.
 */

"use strict";

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

var createUser = function (session, email, password, name, art) {
    var errorResponse = new ErrorResponse(status.InternalError, status.InternalErrorCode, messages.InternalServerError);

    return session.run(Cypher.getUserByEmail(), {email: email})
        .then(function userByEmailCallback(results) {
            if (!_.isEmpty(results.records)) {
                console.log('Error user exist');
                return new ErrorResponse(status.DuplicatedEmail, status.DuplicatedEmail, messages.DuplicateEmail);
            }
            else {
                var currentDate = dateHelper.getTime();
                console.log("Arts: " + JSON.stringify(arts));
                return session.run(Cypher.createUser(),
                    {
                        id: uuid.v4(),
                        email: email,
                        password: hashPassword(email, password),
                        name: name,
                        art: arts[art],
                        created_at: currentDate.toString()
                    }
                ).then(function createUserCallback(results) {
                        try {
                            console.log('Creating user....');
                            var art = results.records[0].get('art');
                            art = arts.indexOf(art);
                            var user = new User(results.records[0].get('user'), art);
                            return new Response(status.Created, user);
                        } catch (err) {
                            console.log("Error creating user with results: " + util.inspect(err));
                            return errorResponse;
                        }
                    }
                ).catch(function createUserError(err) {
                    console.log("Error creating user: " + JSON.stringify(err));
                    return errorResponse;
                });
            }
        }).catch(function userByEmailError(err) {
            console.log("Error checking user exist: " + err.message);
            return errorResponse;
        });
};

function authenticate(session, email, password) {
    return session.run(Cypher.login(), {
        email: email,
        password: hashPassword(email, password)
    }).then(function (results) {
        if (_.isEmpty(results.records[0])) {
            return new ErrorResponse(status.Unauthorized, status.InvalidCredentials, messages.InvalidadCredentials);
        }
        console.log('authenticate successful: ');
        var art = results.records[0].get('art');
        art = arts.indexOf(art);
        var user = new User(results.records[0].get('user'), art);
        var token = generateToken(user);

        var response = new Response(status.Ok, new LoginResult(user, token));
        return response;
    }).catch(function (err) {
        console.log("Error on login: " + err);
        return errors.InternalErrorResponse();

    });
}

var getUsers = function (session, start, counter) {
    console.log("getting users");
    //TODO cambiar el criterio de busqueda en la consulta Cypher (país, arte, centro de estudio o trabajo, provincia)

    return session.run(Cypher.getUsers(), {
        start: start,
        counter: counter
    }).then(function (results) {
        var users = _.map(results.records, record => {
            return new User(record.get('user'), arts.indexOf(record.get('art')));
            //return record._fields[0];
        });
        return new Response(status.Ok, users);
    }).catch(function (err) {
        console.log("Model error getting users: " + JSON.stringify(err));
        return errors.InternalErrorResponse();
        //finish(response);
    });

    /*function finish(response){
     callback(response);
     };*/
};

var updateUser = function (session, id, name, email) {
    return session.run(Cypher.updateUser(),
        {
            id: id,
            name: name,
            email: email,
        }).then(function updateUserResult(results) {
        return new Response(status.Ok, new User(results.records[0].get('user')));
    }).catch(function errorUpdateUsr(err) {
        console.log("Error updating user: " + util.inspect(err));
        return errors.InternalErrorResponse();
    });
};

var findUsersByName = function (session, start, counter, name) {
    console.log("getting users: " + name);
    //TODO cambiar el criterio de busqueda en la consulta Cypher (país, arte, centro de estudio o trabajo, provincia)
    return session.run(Cypher.getUsersByName(), {
        start: start,
        counter: counter,
        name: name
    }).then(function usersResult(results) {
        var users = "";
        if (!validateData.isUndefined(results)) {
            users = _.map(results.records, record => {
                return new User(record.get('user'), arts.indexOf(record.get('art')));
            });
        }
        return new Response(status.Ok, users);
    }).catch(function usersByNameError(err) {
        console.log("Model error getting users by name: " + util.inspect(err));
        return new errors.InternalErrorResponse();
    });
};

var findUsers = function (session, id, field, art, start, counter) {
    //TODO cambiar el criterio de busqueda en la consulta Cypher (país, arte, centro de estudio o trabajo, provincia)
    let cypher_query = Cypher.findUsers();
    if (!_.isEmpty(art)) {
        console.log("art: " + art);
        cypher_query = Cypher.findUsersByArt();
    }

    return session.run(cypher_query, {
        start: start,
        counter: counter,
        field: field,
        id: id,
        art: art
    }).then(function usersResult(results) {
        var users = "";
        if (!validateData.isUndefined(results)) {
            users = _.map(results.records, record => {
                var user = new User(record.get('user'), arts.indexOf(record.get('art')));
                var partner_rel_sent = record.get('partner_rel_sent');
                var partner_rel_received = record.get('partner_rel_received');
                var status = null;

                if (partner_rel_sent != null) {
                    status = partner_rel_sent.properties.status;
                    if (!validateData.isUndefined(status.low))
                        status = status.low;
                    user.invitation_sent = true;
                }
                else if (partner_rel_received != null) {
                    status = partner_rel_received.properties.status;
                    user.invitation_sent = false;
                    if (!validateData.isUndefined(status.low))
                        status = status.low;
                }

                if (validateData.isUndefined(status))
                    status = null;
                user.partner_status = status;
                return user;
            });
        }
        return new Response(status.Ok, users);
    }).catch(function usersByNameError(err) {
        console.log("Model error find users: " + util.inspect(err));
        return new errors.InternalErrorResponse();
    });
};

var findUsersByEmail = function (session, start, counter, email) {
    console.log("model getting users by email: " + email);
    //TODO cambiar el criterio de busqueda en la consulta Cypher (país, arte, centro de estudio o trabajo, provincia)
    return session.run(Cypher.getUsersByEmail(), {
        start: start,
        counter: counter,
        email: email
    }).then(function usersResult(results) {
        var users = "";
        if (!validateData.isUndefined(results)) {
            users = _.map(results.records, record => {
                return new User(record.get('user'), arts.indexOf(record.get('art')));
            });
        }
        return new Response(status.Ok, users);
    }).catch(function usersByEmailError(err) {
        console.log("Model error getting users by email: " + util.inspect(err));
        return new errors.InternalErrorResponse();
    });
};

var findUserById = function (session, id) {
    return session.run(Cypher.getUserById(), {
        id: id
    }).then(function userResult(results) {
        if (!validateData.isUndefined(results.records[0])) {
            var user = results.records[0].get('user');
            var art = results.records[0].get('art');
            art = arts.indexOf(art);
            return new Response(status.Ok, new User(user, art));
        }
        else {
            return new Response(status.Ok, "");
        }
    }).catch(function errorUserById(err) {
        console.log("Error find user by id: " + util.inspect(err));
        return errors.InternalErrorResponse();
    })
};

const getPartners = function (session, id, user_id) {
    return session.run(Cypher.getPartners(), {
        id: id,
        user_id: user_id
    }).then(function getPartnersCallback(results) {
        let users = _.map(results.records, record => {
            let user = new User(record.get('partner'), arts.indexOf(record.get('art')));
            console.log("partners count: " + record.get('partners_count') + " common arts count: "
                + record.get('common_arts_count') + " common partners count: " + record.get('common_partners_count'));
            user.partners_count = record.get('partners_count').low;
            user.common_arts_count = record.get('common_arts_count').low;
            user.common_partners_count = record.get('common_partners_count').low;
            console.log("users: " + user);
            return user;
        });
        return new Response(status.Ok, users);
    }).catch(function getPartnersError(err) {
        console.log("model error get partners: " + util.inspect(err));
        throw  new Error;
    });
};

/*var me = function (session, token) {
 return session.run(Cypher.me,
 {
 token: token
 }).then(function (results) {
 var records = results.records[0];
 console.log(JSON.stringify(records.get('art')));
 var arts = records.get('art').map(r => new Art(r.get('art')));
 return new User(records.get('user'), arts, records.get('name'));
 }).catch(function (err) {
 console.log('Error getting me: ' + JSON.stringify(err));
 });
 };*/

function hashPassword(email, password) {
    var s = email + ':' + password;
    return crypto.createHash('sha256').update(s).digest('hex');
}

function generateToken(user) {
    //TODO secret in a config file
    var token = jwt.sign(user, constants.SECRET, {
        expiresIn: constants.EXPIRATION_TOKEN_IN_SECONDS // expires in 3 days
    });

    return token;
}

module.exports = {
    createUser: createUser,
    authenticate: authenticate,
    getUsers: getUsers,
    findUsersByName: findUsersByName,
    findUserById: findUserById,
    findUsersByEmail: findUsersByEmail,
    findUsers: findUsers,
    updateUser: updateUser,
    getPartners: getPartners
};