/**
 * posts model
 * */

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

const createPost = function (session, user_id, text, art, post_status, oid, uri, type, cb) {
    const time = dateHelper.getTime();
    const formattedDate = dateHelper.getCurrentStringDate("_");
    let results = new Array();
    let success = true;
    const cypherCreatePost = Cypher.createPost(formattedDate, oid, uri, art);
    if (!text)
        text = "";

    let tx = session.beginTransaction();
    tx.run(cypherCreatePost, {
        post_user_id: null,
        post_time: null,
        user_id: user_id,
        text: text,
        type: type,
        status: 0,
        time: time,
        formattedDate: formattedDate

    }).subscribe({
        onNext: function (record) {
            results.push(record);
        },
        onCompleted: function () {
            console.log("finish");
            session.close();
        },
        onError: function (err) {
            console.log("error creting post in db: " + util.inspect(err));
            return new ErrorResponse(status.InternalError, messages.InternalServerError);
        }
    });

    completeTransaction(success, tx, cb, results, oid, uri);
};

function completeTransaction(success, tx, cb, results, oid, uri) {
    if (success) {
        console.log("seccess: ");
        tx.commit().subscribe({
            onCompleted: function (r) {
                try {
                    const record = results.pop();
                    console.log("complete transaction: " + util.inspect(results));
                    if (validateData.isUndefined(record)) {
                        console.log("error occur: ");

                        tx.rollback();
                        cb(errors.InternalErrorResponse());
                    }
                    else {
                        let art = -1;
                        console.log("in art");
                        if (record.keys.indexOf('art') >= 0) {
                            art = arts.indexOf(record.get('art'));
                        }

                        let post = new Post(record.get('post'), art, 0, null, null, 0);
                        if (oid || uri)
                            post.attachment = new File(record.get('attachment'));
                        success = true;
                        console.log("completed");
                        cb(new Response(status.Ok, post));
                    }
                } catch (err) {
                    console.log("on complete error: " + util.inspect(err));
                    return cb(errors.InternalErrorResponse());
                }
            },
            onError: function (err) {
                console.log("error in transaction creating post: " + util.inspect(err));
                /*return tx.rollback().then(function () {
                 cb(errors.InternalErrorResponse());
                 });*/
                cb(errors.InternalErrorResponse());
                success = false;
            }
        });
    }
    else {
        console.log("roll back creating post");
        tx.rollback().then(function () {
            cb(errors.InternalErrorResponse());
        });
    }
}

const responsePost = function (session, post_user_id, post_time, user_id, text, art, post_status, oid, uri, type, cb) {
    const time = dateHelper.getTime();
    const formattedDate = dateHelper.getCurrentStringDate("_");
    let results = new Array();
    let success = true;
    const post_to_response_fromattedDate = dateHelper.getStringDate(new Date(parseInt(post_time)), "_");
    const cypherCreatePost = Cypher.createPost(formattedDate, oid, uri, art, post_to_response_fromattedDate);
    if (!text)
        text = "";

    let tx = session.beginTransaction();
    tx.run(cypherCreatePost, {
        post_user_id: post_user_id,
        post_time: parseInt(post_time),
        user_id: user_id,
        text: text,
        type: type,
        status: 0,
        time: time,
        formattedDate: formattedDate,

    }).subscribe({
        onNext: function (record) {
            console.log("on next: " + util.inspect(record));
            results.push(record);
        },
        onCompleted: function () {
            console.log("finish response");
            session.close();
        },
        onError: function (err) {
            console.log("error creting post in db: " + util.inspect(err));
            return new ErrorResponse(status.InternalError, messages.InternalServerError);
        }
    });

    completeTransaction(success, tx, cb, results, oid, uri);
};

const getTimeline = function (session, id, last_post_time) {
    let formattedDate = dateHelper.getCurrentStringDate("_");
    let last_time = dateHelper.getTime();
    if (last_post_time) {
        formattedDate = dateHelper.getStringDate(new Date(parseInt(last_post_time)), "_");
        last_time = last_post_time;
    }
};

//TODO fix created and  updated date in user, use parseInt when created
const getPosts = function (session, id, last_post_time, time_line, cb) {
        console.log("time: " + last_post_time);
        let latest = dateHelper.getTime();
        if (last_post_time) {
            latest = parseInt(last_post_time);
        }

        let postResults = [];
        const one_day = 1000 * 60 * 60 * 24;
        let date_time = new Date(latest);

        return session.run(Cypher.getUserById(), {id: id})
            .then(function (user_result) {
                    console.log("user posts: " + util.inspect(user_result.records[0].get('user').properties));
                    const earliest = user_result.records[0].get('user').properties['created_at'];

                    let days = new Array();
                    while (date_time > earliest) {
                        console.log("entered here");
                        days.push(date_time);
                        date_time -= one_day;
                    }

                    let formattedDate = "";
                    console.log("formatted date: " + formattedDate);
                    let changeDay = true;
                    async.during(function (callback) {
                            if (changeDay) {
                                if (days.length > 0) {
                                    const date_time = new Date(days.shift());
                                    formattedDate = dateHelper.getStringDate(date_time, "_");
                                }
                                else
                                    return callback(new Error(), false);
                            }
                            ;
                            return callback(null, postResults.length < 10 && !validateData.isUndefined(date_time));
                        },
                        function (callback) {
                            let cypherQuery = session.run(Cypher.getPosts(formattedDate), {
                                id: id,
                                latest_time: latest,
                                earliest_time: parseInt(earliest)
                            });

                            if (time_line == "true") {
                                console.log("time line true");
                                cypherQuery = session.run(Cypher.getPostsTimeline(formattedDate), {
                                    id: id,
                                    latest_time: latest,
                                    earliest_time: parseInt(earliest)
                                });
                            }

                            return cypherQuery
                                .then(function (post_record) {
                                    let count = 0;
                                    const posts = _.map(post_record.records, record => {
                                        console.log("each record " + count++ + ": " + util.inspect(record));
                                        return getPostDetails(record);
                                    });

                                    posts.sort(function (a, b) {
                                        return b.value - a.value;
                                    });

                                    while (posts.length > 0 && postResults.length < 10) {
                                        const p = posts.shift();
                                        if (p.time && !validateData.isUndefined(p.time))
                                            postResults.push(p);
                                    }

                                    if (post_record.records.length >= 3) {
                                        latest = parseInt(postResults[postResults.length - 1]['time']);
                                        console.log("new latest: " + latest);
                                        if (dateHelper.getStringDate(new Date(latest), "_") == formattedDate) {
                                            changeDay = false;
                                            console.log("despues while");
                                        }
                                        else
                                            changeDay = true;
                                    }
                                    else
                                        changeDay = true;
                                    callback();
                                    //if (postResults.length >= constants.GET_POSTS_LIMIT || from_time <= earlier_time)
                                }).catch(function (err) {
                                    console.log("error getting post db: " + util.inspect(err));
                                    //callback();
                                    cb(errors.InternalErrorResponse());
                                });
                        },
                        function (err) {
                            console.log("get posts finish");
                            return cb(new Response(status.Ok, postResults));
                        });
                }
            ).catch(function (err) {
                console.log("error getting db: " + util.inspect(err));
                return cb(errors.InternalErrorResponse());
            });

// while(postCount < constants.GET_POSTS_LIMIT && )
    }
    ;


const findPost = function (session, post_user_id, post_time) {
    const formatterDate = dateHelper.getStringDate(new Date(parseInt(post_time)), "_");
    return session.run(Cypher.findPost(formatterDate), {
        post_user_id: post_user_id,
        post_time: parseInt(post_time)
    }).then(function findPostCallback(result) {
        if (result.records.length > 0)
            return new Response(status.Ok, getPostDetails(result.records[0]));
        else
            return new Response(status.Ok, "");
    }).catch(function findPostError(err) {
        console.log('model find post error: ' + util.inspect(err));
        throw new Error();
    });
};

//TODO put offset limit constant
const getPostResponses = function (session, post_user_id, time, offset, limit) {
    try {
        const post_time = parseInt(time);

        const formattedDate = dateHelper.getStringDate(new Date(post_time), "_");
        return session.run(Cypher.getPostResponses(formattedDate), {
            post_user_id: post_user_id,
            post_time: post_time,
            limit: parseInt(limit),
            offset: parseInt(offset),
        }).then(function getPostResponsesCallback(results) {
            console.log('result: ' + util.inspect(results));
            const responses = _.map(results.records, record => {
                return getPostDetails(record);
            });
            return new Response(status.Ok, responses);
        }).catch(function getPostResponsesError(err) {
            console.log("router getting post responses error: " + util.inspect(err));
            throw new Error();
        });
    } catch (Error) {
        throw new Error();
    }
};

const getPostNiceUsers = function (session, post_user_id, time, offset, limit) {
    try {
        const post_time = parseInt(time);
        console.log("post_time: " + post_time + "post_user_id: " + post_user_id + "offset: " + offset + "limit: " + limit);
        const formattedDate = dateHelper.getStringDate(new Date(post_time), "_");
        return session.run(Cypher.getPostNiceUsers(formattedDate), {
            post_user_id: post_user_id,
            post_time: post_time,
            offset: parseInt(offset),
            limit: parseInt(limit)
        }).then(function getPostResponsesCallback(results) {
            console.log('result: ' + util.inspect(results.records));
            const response = _.map(results.records, record => {
                return getUserBasicDetails(record.get('user').properties);
            });
            return new Response(status.Ok, response);
        }).catch(function getPostResponsesError(err) {
            console.log("router getting post nice users error: " + util.inspect(err));
            throw new Error();
        });
    } catch (Error) {
        throw new Error();
    }
};


//TODO file helper for files
const createNice = function (session, id, user_id, post_time) {
    const formattedPostTime = dateHelper.getStringDate(new Date(parseInt(post_time)), "_");
    const tempPostTime = parseInt(post_time);
    const time = dateHelper.getTime();
    return session.run(Cypher.userNicePost(formattedPostTime), {
        post_time: tempPostTime,
        id: id,
        user_id: user_id
    }).then(function userNicePostResult(result) {
        if (result.records.length <= 0) {
            return session.run(Cypher.createNice(formattedPostTime), {
                id: id,
                time: time,
                user_id: user_id,
                post_time: tempPostTime
            }).then(function nicePostResult(result) {
                console.log("result + " + util.inspect(result));
                /* let post = {};
                 const record = result.records[0];
                 console.log(util.inspect(session));
                 if (record) {
                 post = result.records[0].get('post').properties;
                 post.nice_count = result.records[0].get('nice_count').low;
                 const nodeUsers = result.records[0].get('nice_users');
                 post.nice_users = _.map(nodeUsers, user => {
                 return getUserBasicDetails(user.properties);
                 });
                 }**/

                if (result.records.length > 0)
                    return new Response(status.Ok, {done: true});
                else
                    return new Response(status.Ok, {done: false});
            }).catch(function nicePostError(err) {
                console.log('model crete nice error: ' + util.inspect(err));
                return new ErrorResponse(errors.InternalErrorResponse());
            });
        }
        else
            return errors.BadRequestErrorResponse(messages.AlreadyNicePost);
    }).catch(function userNicePost(err) {
        console.log("model checking exist post error: " + util.inspect(err));
    });
};

const removeNice = function (session, id, user_id, post_time) {
    const formattedPostTime = dateHelper.getStringDate(new Date(parseInt(post_time)), "_");
    const tempPostTime = parseInt(post_time);

    return session.run(Cypher.removeNice(formattedPostTime), {
        id: id,
        user_id: user_id,
        post_time: tempPostTime
    }).then(function nicePostResult(result) {
        if (result.records.length > 0)
            return new Response(status.Ok, {done: true});
        else
            return new Response(status.Ok, {done: false});
    }).catch(function nicePostError(err) {
        console.log('model crete nice error: ' + util.inspect(err));
        return new ErrorResponse(errors.InternalErrorResponse());
    });
};

const getPostDetails = function (record) {
    const node_post = record.get('post');
    let attachment = null;
    if (record.keys.indexOf('attachment') >= 0) {
        const tmp_attachment = record.get('attachment');
        if (tmp_attachment)
            attachment = record.get('attachment');
    }
    const art_post = record.get('art');
    const art = arts.indexOf(art_post);
    const nice_count = record.get('nice_count').low;
    //const responses = record.get('responses').properties;
    const responses_count = record.get('responses_count').low;
    const nodeUsers = record.get('nice_users');
    const nice_users = _.map(nodeUsers, user => {
        if (user) {
            console.log("nice useres: " + util.inspect(user));
            return getUserBasicDetails(user.properties);
        }
        else
            return null;
    });
    let user = null;
    if (record.get('user') && !validateData.isUndefined(record.get('user'))) {
        console.log("post user: " + util.inspect(user));
        user = getUserBasicDetails(record.get('user').properties);
    }
    let post = new Post(node_post, art, nice_count, null, responses_count, attachment, nice_users, user);
    if (record.keys.indexOf('nice_for_me') >= 0)
        post.nice_for_me = record.get('nice_for_me').low;
    return post;
};


//TODO users online
const getUserBasicDetails = function (_user) {
    console.log(_user.name);
    if (_user)
        return {name: _user.name, id: _user.id, avatar: _user.avatar};
    return null;
};

module.exports = {
    createPost: createPost,
    getPosts: getPosts,
    findPost: findPost,
    getPostResponses: getPostResponses,
    getPostNiceUsers: getPostNiceUsers,
    createNice: createNice,
    removeNice: removeNice,
    responsePost: responsePost
};