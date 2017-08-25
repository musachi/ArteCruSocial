const _ = require('lodash');
const status = require('../models/Service/status');
const User = require('../models/neo4j_model/user');
const jwt = require('jsonwebtoken');
//TODO change secret for a file
const secret = require('../helpers/contants').constants.SECRET;
const Response = require('../models/Service/response');
const ErrorResponse = require('../models/Service/error-response');
const writeResponse = require('../helpers/write-response');
const messages = require('../helpers/messages').messages;
const nconf = require('../config');
const util = require('util');
const stringHelper = require('../helpers/string-helper');

//TODO mejorar el API path y hacer un for para que cheque las urls que no va a verificar para token
const authUser = module.exports = function (req, res, next) {
        const api_path = nconf.get('api_path');
        let errorResponse = new ErrorResponse(status.Unauthorized, messages.InvalidToken);
        console.log("request url: " + String(req.url).toString());
        const avatar = "/avatar?id=";
        if (req.url === '/' || (req.url === '/users' && req.method === 'POST') || req.url === '/authenticate'
            || req.url === api_path + '/docs/dist' || req.url === '/favicon.ico' || req.url.indexOf("download?id=") >= 0
            || req.url.indexOf("avatar?id=") >= 0 || req.url.indexOf("jquery.js") >= 0) {
            console.log("skipping auth request: ");
            next();
        }
        else if (req.url.indexOf('/connection') >= 0) {
            const message_token = req.headers['sec-websocket-protocol'];
            jwt.verify(message_token, "martesinnigth", function (err, user_id) {
                console.log("user id: ", user_id);
                if (err) {
                    req.token_error = "true";
                    next();
                }
                else {
                    req.user_id = user_id;
                    next();
                }
            });
        }
        else {
            const authorization = req.headers['authorization'];
            if (/*(req.headers['access-control-request-method'] || req.headers['access-control-request-headers']) && */req.method === 'OPTIONS') {
                console.log("options request");
                writeResponse.write(res, new Response(status.Ok, ""));
            }
            else if (!authorization || authorization.split(' ').length < 2) {
                //next();
                console.log("authorization: " + authorization);
                writeResponse.write(res, errorResponse);
            }
            else {
                const authHeader = authorization.split(' ');
                if (!authHeader || !authHeader[1]) {
                    req.user = null;
                    //console.log("auth header: " + authHeader);
                    console.log("auth header: " + authHeader.toString());
                    writeResponse.write(res, errorResponse);
                    return res;
                }
                else {
                    const token = authHeader[1];
                    jwt.verify(token, secret, function (err, user) {
                        if (err) {
                            writeResponse.write(res, errorResponse);
                            return res;
                            //return res;
                        }
                        else {
                            req.user = user;
                            next();
                        }
                    });
                }
            }
        }
    }
    ;