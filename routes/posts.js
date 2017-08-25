/**
 * posts route
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

const dateHelper = require('../helpers/date-helper');
const posts = require('../models/Posts/posts');
const File = require('../models/neo4j_model/file');

let validRegisterData = true;
let validLoginData = true;
const constants = constantsVars.constants;
const arts = constantsVars.arts();

exports.createPost = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const text = _.get(req.body, 'text');
    console.log("text: " + util.inspect(text));
    const oid = _.get(req.body, 'attachment_id');
    let art = _.get(req.body, 'art');
    art = arts[art];
    const type = _.get(req.body, 'type');
    const user_id = req.user['id'];
    const uri = _.get(req.body, 'attachment_uri');

    if (validateData.isUndefined(user_id))
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    else if (validateData.isUndefined(text) && validateData.isUndefined(oid))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else {
        if (!validateData.isUndefined(oid) && validateData.isUndefined(type))
            writeResponse.write(res, errors.BadRequestErrorResponse());
        else
            posts.createPost(session, user_id, text, art, 0, oid, uri, type, function createPostCallback(response) {
                writeResponse.write(res, response);
            });
    }
};

exports.getPosts = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const id = req.user['id'];
    let last_post_time = _.get(req.query, 'last_post_time');
    let time_line = _.get(req.query, 'timeline');

    if (!time_line || validateData.isUndefined(time_line))
        time_line = null;
    if (validateData.isUndefined(last_post_time))
        last_post_time = null;
    if (validateData.findUndefined([session, id])) {
        writeResponse.write(res, errors.InternalErrorResponse());
    }
    else
        posts.getPosts(session, id, last_post_time, time_line, function getPostCallback(response) {
            writeResponse.write(res, response);
        }).catch(function getPostsError(err) {
            writeResponse.write(res, errors.InternalErrorResponse());
        });
};

exports.responsePost = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const text = _.get(req.body, 'text');
    const oid = _.get(req.body, 'attachment_id');
    let art = _.get(req.body, 'art');
    art = arts[art];
    const type = _.get(req.body, 'type');
    const user_id = req.user['id'];
    const uri = _.get(req.body, 'attachment_uri');
    const post_user_id = _.get(req.body, 'user_id');
    const post_time = _.get(req.body, 'time');

    if (validateData.isUndefined(user_id))
        writeResponse.write(res, errors.ForbiddenErrorResponse());
    else if ((validateData.isUndefined(text) && validateData.isUndefined(oid)) || validateData.isUndefined(post_user_id) || validateData.isUndefined(post_time))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else {
        if (!validateData.isUndefined(oid) && validateData.isUndefined(type))
            writeResponse.write(res, errors.BadRequestErrorResponse());
        else
            posts.responsePost(session, post_user_id, post_time, user_id, text, art, 0, oid, uri, type, function createPostCallback(response) {
                writeResponse.write(res, response);
            });
    }
};

//TODO put limit in other file, post text limit = 1500 chracterers in text and check them
exports.getPostResponses = function (req, res, next) {
    console.log("starting... get responses");
    const session = dbNeo4j.getSession(req);
    const post_user_id = _.get(req.query, 'post_user_id');
    const post_time = _.get(req.query, 'time');
    const offset = _.get(req.query, 'offset');
    const limit = _.get(req.query, 'limit');
    const last_response_time = _.get(req.query, 'last_response_time');

    console.log("post user id: " + post_user_id + "\n" + "post time: " + post_time);

    if (validateData.isUndefined(session))
        writeResponse.write(res, errors.InternalErrorResponse());
    else if (validateData.isUndefined(post_time) || validateData.isUndefined(post_user_id)) {
        console.log("sasas................");
        writeResponse.write(res, errors.BadRequestErrorResponse());
    }
    else {
        posts.getPostResponses(session, post_user_id, post_time, offset, limit)
            .then(function getPostResponsesCallback(response) {
                writeResponse.write(res, response);
            })
            .catch(function getPostResponsesError(err) {
                writeResponse.write(res, errors.InternalErrorResponse());
            });
    }
};

//todo CHEC IF THERE IS NOT OFFSET OR LIMIT, PASS ONE BY DEFAUTL
exports.findPost = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const post_user_id = _.get(req.query, 'user_id');
    const post_time = req.params.time;

    if (validateData.isUndefined(session))
        writeResponse.write(res, errors.InternalErrorResponse());
    else if (validateData.isUndefined(post_time) || validateData.isUndefined(post_user_id))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else {
        posts.findPost(session, post_user_id, post_time)
            .then(function findPostCallback(response) {
                writeResponse.write(res, response);
            })
            .catch(function findPostError(err) {
                console.log("router find post error: " + util.inspect(err));
                writeResponse.write(res, errors.InternalErrorResponse());
            });
    }
};

exports.getPostNiceUsers = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const post_user_id = _.get(req.query, 'post_user_id');
    const post_time = _.get(req.query, 'post_time');
    const offset = _.get(req.query, 'offset');
    const limit = _.get(req.query, 'limit');

    //TODO put limit and ofset by default in other file
    if (!session || validateData.isUndefined(session))
        writeResponse.write(res, errors.InternalErrorResponse());
    else if (validateData.isUndefined(post_time) || validateData.isUndefined(post_user_id))
        writeResponse.write(res, errors.BadRequestErrorResponse());
    else {
        posts.getPostNiceUsers(session, post_user_id, post_time, offset, limit)
            .then(function getPostNiceUsersCallback(response) {
                writeResponse.write(res, response);
            })
            .catch(function getPostNiceUsersError(err) {
                console.log("model getting post nice users: " + util.inspect(err));
                writeResponse.write(res, errors.InternalErrorResponse());
            });
    }
};

exports.createNice = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const post_time = _.get(req.body, 'post_time');
    const user_id = _.get(req.body, 'user_id');
    const id = req.user['id'];

    console.log("post_time: " + post_time + "----" + "user id: " + user_id);

    posts.createNice(session, id, user_id, post_time).then(function createNiceCallback(response) {
        writeResponse.write(res, response);
    }).catch(function createNiceError(err) {
        console.log("routing create nice error: " + util.inspect(err));
        writeResponse.write(res, errors.InternalErrorResponse());
    });
};

exports.removeNice = function (req, res, next) {
    const session = dbNeo4j.getSession(req);
    const post_time = _.get(req.query, 'post_time');
    const user_id = _.get(req.query, 'user_id');
    const id = req.user['id'];

    posts.removeNice(session, id, user_id, post_time).then(function removeNiceCallback(response) {
        writeResponse.write(res, response);
    }).catch(function removeNiceError(err) {
        console.log("routing create nice error: " + util.inspect(err));
        writeResponse.write(res, errors.InternalErrorResponse());
    });
};


