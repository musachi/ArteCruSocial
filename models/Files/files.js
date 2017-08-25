/**
 * files model
 */

const pg = require('pg');
let ErrorResponse = require('../Service/error-response');
let Response = require('../Service/response');
const status = require('../Service/status');
const messages = require('../../helpers/messages').messages;
const multer = require('multer');
const util = require('util');
const constants = require('../../helpers/contants').constants;
const _ = require('lodash');
const validateData = require('../../helpers/validate-data');
const LargeObjectManager = require('pg-large-object').LargeObjectManager;
const dbpg = require('../../pg/db-pg');
const fs = require('fs');

const getAvatar = function (res, oid, cb) {
    const connectionString = dbpg.connectionString();

    pg.connect(connectionString, function (err, client, done) {
        if (err) {
            cb(new ErrorResponse(status.InternalError, messages.InvalidadCredentials));
        }
        else {
            var man = new LargeObjectManager({pg: client});
            client.query('BEGIN', function (err, results) {
                if (err) {
                    done(err);
                    console.log(messages.ErrorSavingFile + ": " + util.inspect(err));
                    cb(new ErrorResponse(status.InternalError, messages.ErrorSavingFile));
                }
                else {
                    const writeFile = true;
                    const bufferSize = 16384;

                    if (!writeFile)
                        man.open(oid, LargeObjectManager.READ, function (err, obj) {
                            if (!err) {
                                obj.size(function (err, size) {
                                    console.log("size:" + size);
                                    obj.read(size, function (err, data) {
                                        client.query('COMMIT', done).on('end', function () {
                                            client.end();
                                            res.header("Content-Type", "image/jpeg");
                                            res.header("Content-Length", size);
                                            cb(new Response(status.Ok, {data: data.toString('base64')}));
                                        });
                                    });
                                });
                            }
                        });

                    if (writeFile)
                        man.openAndReadableStream(oid, bufferSize, function (err, size, stream) {
                            if (err) {
                                console.log("open redeable stream error: " + util.inspect(err));
                                cb(new ErrorResponse(status.InternalError, messages.InvalidArt));
                            }
                            else {
                                console.log('Streaming a large object with a total size of', size);
                                //var fileStream = require('fs').createWriteStream(constants.TEMP_PATH_FILES + 'file.png');

                                stream.pipe(res);
                                stream.on('end', function (result) {
                                    client.query('COMMIT', done).on('end', function () {
                                        console.log("finish");
                                        //client.end();
                                        //res.end();
                                       pg.end();
                                    });
                                    //cb(new Response(status.Ok, {image: result}));
                                   /* res.sendfile(constants.TEMP_PATH_FILES + 'file.png', null, function(err, done)
                                    {
                                        console.log("done: " + done);
                                    });*/
                                });
                            }
                        });
                }
            });
        }

    });
};

module.exports = {
    getAvatar: getAvatar
};