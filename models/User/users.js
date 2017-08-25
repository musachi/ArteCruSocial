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
    var errorResponse = new ErrorResponse(status.InternalError, messages.InternalServerError);

    return session.run(Cypher.getUserByEmail(), {email: email})
        .then(function userByEmailCallback(results) {
            if (!_.isEmpty(results.records)) {
                console.log('Error user exist');
                return new ErrorResponse(status.DuplicatedEmail, messages.DuplicateEmail);
            }
            else {
                const currentDate = dateHelper.getTime();
                return session.run(Cypher.createUser(),
                    {
                        id: uuid.v4(),
                        email: email,
                        password: hashPassword(email, password),
                        name: name,
                        art: arts[art],
                        created_at: currentDate
                    }
                ).then(function createUserCallback(results) {
                        try {
                            console.log('Creating user....');
                            const user = getUserDetails(results.records[0]);
                            return new Response(status.Created, user);
                        } catch (err) {
                            console.log("Error creating user with results: " + util.inspect(err));
                            return errorResponse;
                        }
                    }
                ).catch(function createUserError(err) {
                    console.log("Error creating user: " + util.inspect(err));
                    return errorResponse;
                });
            }
        }).catch(function userByEmailError(err) {
            console.log("Error checking user exist: " + err.message);
            return errorResponse;
        });
};

function authenticate(session, username, password) {
    //TODO cambiar el email para generar la constrasenya
    var secretValue = "pepe*/salsilla";
    return session.run(Cypher.login(), {
        email: username,
        password: hashPassword(username, password)
    }).then(function (results) {
        if (_.isEmpty(results.records[0])) {
            return new ErrorResponse(status.Unauthorized, messages.InvalidadCredentials);
        }

        var user = getUserDetails(results.records[0]);
        var token = generateToken(user);
        return new Response(status.Ok, new LoginResult(user, token));
    }).catch(function (err) {
        console.log("Error on login: " + err);
        return errors.InternalErrorResponse();
    });
}

var getUsers = function (session, offset, limit) {
    console.log("getting users");
    //TODO cambiar el criterio de busqueda en la consulta Cypher (país, arte, centro de estudio o trabajo, provincia)

    return session.run(Cypher.getUsers(), {
        offset: offset,
        limit: limit
    }).then(function (results) {
        var users = _.map(results.records, record => {
            return getUserDetails(record);
            //return record._fields[0];
        });
        return new Response(status.Ok, users);
    }).catch(function (err) {
        console.log("Model error getting users: " + util.inspect(err));
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
        return new Response(status.Ok, getUserDetails(results.records[0]));
    }).catch(function errorUpdateUsr(err) {
        console.log("Error updating user: " + util.inspect(err));
        return errors.InternalErrorResponse();
    });
};

const updateUserAvatar = function (session, id, avatar) {
    const cypher_params = {
        id: id,
        avatar: avatar
    };
    return session.run(Cypher.updateUserAvatar(), cypher_params)
        .then(function updateAvatarResult(results) {
            return results.records[0].get('avatar');
        }).catch(function errorUpdateUsr(err) {
            console.log("module updating user avatar error: " + util.inspect(err));
            return errors.InternalErrorResponse();
        });
};

//TODO put arts in separated file
const addArtsToUser = function (session, id, arts_values) {
    let arts_names = [];
    arts_values.forEach(function (art) {
        arts_names.push(arts[art]);
    });

    return session.run(Cypher.addArtsToUser(),
        {
            id: id,
            arts: arts_names
        }).then(function addArtsToUserCallback(results) {
        if (results.records.length > 0) {
            console.log("results: " + util.inspect(results));
            const user = getUserDetails(results.records[0]);
            return new Response(status.Ok, user);
        }
        return "";
    }).catch(function addArtsToUserError(err) {
        console.log("model error addd arts to user: " + util.inspect(err));
        throw new Error;
    });
};

var deleteArtsFromUser = function (session, id, arts_values) {
    let arts_names = [];
    arts_values.forEach(function (art) {
        arts_names.push(arts[art]);
    });

    return session.run(Cypher.deleteArtsFromUser(),
        {
            id: id,
            arts: arts_names
        }).then(function deleteArtsFromUserCallback(results) {
        if (results.records.length > 0)
            return true;
        return false;
    }).catch(function deleteArtsFromUserError(err) {
        console.log("model error deleting arts from user: " + util.inspect(err));
        throw new Error;
    });
};

var findUsersByName = function (session, offset, limit, name) {
    console.log("getting users: " + name);
    //TODO cambiar el criterio de busqueda en la consulta Cypher (país, arte, centro de estudio o trabajo, provincia)
    return session.run(Cypher.getUsersByName(), {
        offset: offset,
        limit: limit,
        name: name
    }).then(function usersResult(results) {
        var users = "";
        if (!validateData.isUndefined(results)) {
            users = _.map(results.records, record => {
                return getUserDetails(record);
            });
        }
        return new Response(status.Ok, users);
    }).catch(function usersByNameError(err) {
        console.log("Model error getting users by name: " + util.inspect(err));
        return new errors.InternalErrorResponse();
    });
};

var findUsers = function (session, id, field, art, offset, limit) {
    //TODO cambiar el criterio de busqueda en la consulta Cypher (país, arte, centro de estudio o trabajo, provincia)
    let cypher_query = Cypher.findUsers();
    if (!_.isEmpty(art)) {
        cypher_query = Cypher.findUsersByArt();
    }

    return session.run(cypher_query, {
        offset: offset,
        limit: limit,
        field: field,
        id: id,
        art: art
    }).then(function usersResult(results) {
        var users = "";
        if (!validateData.isUndefined(results)) {
            users = _.map(results.records, record => {
                let user = getUserDetails(record);
                const partner_rel_sent = record.get('partner_rel_sent');
                const partner_rel_received = record.get('partner_rel_received');
                let status = null;

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

const findUsersByEmail = function (session, offset, limit, email) {
    console.log("model getting users by email: " + email);
    //TODO cambiar el criterio de busqueda en la consulta Cypher (país, arte, centro de estudio o trabajo, provincia)
    return session.run(Cypher.getUsersByEmail(), {
        offset: offset,
        limit: limit,
        email: email
    }).then(function usersResult(results) {
        var users = "";
        if (!validateData.isUndefined(results)) {
            users = _.map(results.records, record => {
                return getUserDetails(record);
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
            return new Response(status.Ok, getUserDetails(results.records[0]));
        }
        else {
            return new Response(status.Ok, "");
        }
    }).catch(function errorUserById(err) {
        console.log("Error find user by id: " + util.inspect(err));
        return errors.InternalErrorResponse();
    })
};

const getPartners = function (session, id, user_id, limit, offset) {

    let cypher_query = Cypher.getPartners();
    if (user_id != id)
        cypher_query = Cypher.getUserPartners();

    console.log("id: " + id);
    console.log("user id: " + user_id);

    return session.run(cypher_query, {
        id: id,
        user_id: user_id,
        limit: limit,
        offset: offset
    }).then(function getPartnersCallback(results) {
        let users = _.map(results.records, record => {
            let other_arts = [];
            const main_art = record.get('art');
            record.get('arts').forEach(function (art) {
                if (art != main_art)
                    other_arts.push(arts.indexOf(art));
            });
            let response = {};
            response.user = new User(record.get('user'), arts.indexOf(main_art), other_arts);

            response.partners_count = record.get('partners_count').low;

            response.common_arts_count = record.get('common_arts_count').low;
            response.common_partners_count = record.get('common_partners_count').low;

            console.log("response.common_partners_count: " + response.common_partners_count);
            if (id != user_id) {
                const partner_rel_sent = record.get('r_sent');
                const partner_rel_received = record.get('r_received');
                let status = null;

                if (partner_rel_sent != null) {
                    status = partner_rel_sent.properties.status;
                    if (!validateData.isUndefined(status.low))
                        status = status.low;
                    response.invitation_sent = true;
                }
                else if (partner_rel_received != null) {
                    status = partner_rel_received.properties.status;
                    response.invitation_sent = false;
                    if (!validateData.isUndefined(status.low))
                        status = status.low;
                }

                if (validateData.isUndefined(status))
                    status = null;
                response.partner_status = status;
            }

            if (response.user['id'] == id) {
                response.common_partners_count = 0;
                response.common_arts_count = 0;
            }

            return response;
        });
        return new Response(status.Ok, users);
    }).catch(function getPartnersError(err) {
        console.log("model error get partners: " + util.inspect(err));
        throw  new Error;
    });
};

function getUserDetails(record) {
    let user_node = "";
    let art = "";
    let other_arts = [];
    if (!validateData.isUndefined(record));
    {
        try {
            const user_node = record.get('user');
            const art = arts.indexOf(record.get('art'));
            if (record.keys.indexOf('arts') > -1)
                record.get('arts').forEach(function (art) {
                    other_arts.push(arts.indexOf(art));
                });

            return new User(user_node, art, other_arts);
        }
        catch (err) {
            console.log("model error getting user details: " + err);
            return new User(user_node, art, Object.UNDEFINED);
        }
    }
}

var getArts = function (session, id) {
    return session.run(Cypher.getArts(), {
        id: id
    }).then(function getArtsCallback(results) {
        if (results.records.length > 0) {
            let data_response = {};
            data_response.art = arts.indexOf(results.records[0].get('art'));
            let arts_values = [];
            results.records[0].get('arts').forEach(function (art) {
                arts_values.push(arts.indexOf(art));
            });
            data_response.arts = arts_values;
            return new Response(status.Ok, data_response);
        }
        return "";
    }).catch(function getArtsError(err) {
        console.log("model error getting arts: " + util.inspect(err));
        throw new Error;
    });
};

//TODO put in other file for use whenever we need

function hashPassword(username, password) {
    var s = username + ':' + password;
    return crypto.createHash('sha256').update(s).digest('hex');
}


//TODO review log generated
function generateToken(user, secret) {
    //TODO secret in a config file
    return jwt.sign(user, secret || constants.SECRET, {
        expiresIn: constants.EXPIRATION_TOKEN_IN_SECONDS // expires in 3 days
    });
}

module.exports = {
    createUser: createUser,
    authenticate: authenticate,
    getUsers: getUsers,
    addArtsToUser: addArtsToUser,
    findUsersByName: findUsersByName,
    findUserById: findUserById,
    findUsersByEmail: findUsersByEmail,
    findUsers: findUsers,
    updateUser: updateUser,
    updateUserAvatar: updateUserAvatar,
    getPartners: getPartners,
    getArts: getArts,
    deleteArtsFromUser: deleteArtsFromUser
};