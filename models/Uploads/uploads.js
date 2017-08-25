/**
 * uploads
 */

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
const pg = require('pg');
const dbpg = require('../../pg/db-pg');
const fs = require('fs');
const nconf = require('../../config');
const errors = require('../Service/errors');
const filter_mimetypes = require('../../helpers/contants').file_mimetypes;
const filter_extensions = require('../../helpers/contants').file_extensions;
const path = require('path');
const updateUserAvatar = require('./../User/users').updateUserAvatar;
const crypt = require('../../helpers/crypt-helper');
const async = require('async');
const uriHelper = require('../../helpers/uri-helper');
const sqlQuery = require('../../pg/sql');

//todo poner tmp/uploads in separate var
const StorageFiles = multer.diskStorage(
    {
        destination: function (req, file, callback) {
            callback(null, './tmp/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, generateFilename(file));
        }
    }
);

const fileFilter = function (req, file, filter_type, filter_extension, err_message, callback) {
    const ext = path.extname(file.originalname);
    const type = file.mimetype;
    const permitedExtension = filter_extension.indexOf(ext.toLowerCase());
    const permitedMimetype = filter_type.indexOf(type.toLowerCase());
    console.log("file ext: " + ext + " mimetype: " + type);
    if (permitedMimetype >= 0 && permitedExtension >= 0)
        callback(null, true);
    else
        callback(new Error(err_message));
};

const imageFilter = function (req, file, callback) {
    fileFilter(req, file, filter_mimetypes.image, filter_extensions.image, messages.OnlyImages, callback);
};

const musicFilter = function (req, file, callback) {
    fileFilter(req, file, filter_mimetypes.music, filter_extensions.music, messages.OnlyMusic, callback);
};

const docFilter = function (req, file, callback) {
    fileFilter(req, file, filter_mimetypes.doc, filter_extensions.doc, messages.OnlySomeDocsType, callback);
};

const videoFilter = function (req, file, callback) {
    fileFilter(req, file, filter_mimetypes.video, filter_extensions.video, messages.OnlyVideo, callback);
};

//const file

const uploaderAvatar = multer(
    {
        storage: StorageFiles,
        fileFilter: function (req, file, callback) {
            imageFilter(req, file, callback);
        },
        limits: {
            fileSize: 2 * 1024 * 1024,
            fieldNameSize: 50,
            files: 1
        }
    }
).single('file'); //Field name

const uploaderImages = multer(
    {
        storage: StorageFiles,
        fileFilter: function (req, file, callback) {
            imageFilter(req, file, callback);
        },
        limits: {
            fileSize: 2 * 1024 * 1024,
            fieldNameSize: 50,
            files: 1
        }
    }
).single('file');

//TODO put all limits in contstants file
const uploaderFiles = multer({
    storage: StorageFiles,
    limits: {
        fileSize: 2 * 1024 * 1024,
        fieldNameSize: 50,
        files: 1
    }
});

const uploaderMusic = multer(
    {
        storage: StorageFiles,
        limits: {
            fileSize: 4 * 1024 * 1024,
            fieldNameSize: 50,
            files: 3
        }
    }
);

function getFileDataContent(file, localFilename) {
    let dbField = {};
    const currentDate = new Date();
    dbField.filename = localFilename;
    dbField.path = constants.TEMP_PATH_UPLOADS + localFilename;
    dbField.type = file.mimetype;
    dbField.size = file.size;
    dbField.creationDate = currentDate.getTime();
    dbField.usedDate = currentDate.getTime();
    filesDataContent.push(dbField);
};

let filesDataContent = new Array();
const FILE_NAME = "fileUpload";

//TODO validate file size, file originalname length
function generateFilename(file) {
    const filename = FILE_NAME + "_" + Date.now() + "_" + file.originalname;
    getFileDataContent(file, filename);
    return filename;
}

//TODO convert image to jpg and crompress them

const uploadAvatar = function (session, req, res, pgpClient, userId, cb) {
    console.log("uploading avatar");
    uploadSingleImage(req, res, pgpClient, userId, function (saveResponse) {
        if (saveResponse.status == status.Ok) {
            updateUserAvatar(session, userId, saveResponse.data.attachmentId)
                .then(function updateAvatarResponse(response) {
                    return cb(saveResponse);
                }).catch(function (err) {
                return cb(err);
            });
        }
        else
            return cb(saveResponse);
    }, uploaderAvatar);
};

const uploadSingleImage = function (req, res, pgpClient, userId, cb, uploader) {
    console.log("upload single image");
    uploader(req, res, function (err) {
        if (err) {
            console.log("error uploading file");
            clearArray(filesDataContent);
            console.log("uploading avatar error: " + util.inspect(err));
            if (err.code == "LIMIT_UNEXPECTED_FILE")
                cb(new ErrorResponse(status.BadRequest, messages.ExceededLimitFilesUpload));
            else
                cb(new ErrorResponse(status.BadRequest, err.message));
            // getFileDataContent.clear();
        }
        else {
            console.log("no error");
            //TODO pass pessage saying empty file
            if (filesDataContent.length == 0) {
                clearArray(filesDataContent);
                cb(errors.BadRequestErrorResponse());
            }
            else
                saveFileInDb(filesDataContent.pop(), pgpClient, userId, cb);
        }
    });
};

const clearArray = function (array) {
    if (array && !validateData.isUndefined(array)) {
        while (array.length)
            array.pop();
    }
};

const uploadImages = function (req, res, pgpClient, userId, cb) {
    uploadFiles(req, res, pgpClient, userId, cb, uploaderImages);
};

const uploadFiles = function (req, res, pgpClient, userId, cb, uploader) {
    uploader(req, res, function (err) {
        if (err) {
            clearArray(filesDataContent);
            console.log("error is here");
            if (err.code == "LIMIT_UNEXPECTED_FILE")
                cb(new ErrorResponse(status.BadRequest, messages.ExceededLimitFilesUpload));
            else
                cb(new ErrorResponse(status.BadRequest, err.message));
        }
        else {
            let idImages = new Array();
            let sendedCallback = false;
            const totalFileToSave = filesDataContent.length;
            if (totalFileToSave.length == 0) {
                console.log("leng: " + totalFileToSave.length);
                clearArray(filesDataContent);
                cb(errors.InternalErrorResponse());
            }
            else
                _.forEach(filesDataContent, function (file) {
                    saveFileInDb(file, pgpClient, userId, function (result) {
                        if (result.status == status.Ok) {
                            if (idImages.indexOf(result.data) < 0) {
                                idImages.push(result.data);
                            }
                            filesDataContent.pop();
                        }
                        else if (!sendedCallback) {
                            console.log("result.status: " + result.status);
                            sendedCallback = true;
                            cb(new ErrorResponse(status.InternalError, messages.InternalServerError));
                        }

                        if (!sendedCallback && idImages.length == totalFileToSave) {
                            sendedCallback = true;
                            console.log("");
                            cb(new Response(result.status, idImages));
                        }
                    });
                });
        }
    });
};

const saveFileInDb = function (file, pgpClient, userId, cb) {
    pgpClient.tx((tx) => {
        const man = new LargeObjectManager({pgPromise: tx});
        const bufferSize = 16384;
        console.log("init transaction");
        return man.createAndWritableStreamAsync(bufferSize)
            .then(function ([oid, stream]) {
                console.log("creating oid " + oid);
                const fileStream = fs.createReadStream(file.path);
                fileStream.pipe(stream);
                const uri = uriHelper.generateFileUri(userId, oid);
                return new Promise(function (resolve, reject) {
                    stream.on('finish', function () {
                        console.log("finish");
                        fs.unlink(file.path, function (err) {
                            if (err)
                                console.log("Error deleting files: " + util.inspect(err));
                        });
                        return tx.query({
                            name: "insert data_content ",
                            text: sqlQuery.insertDataContent(),
                            values: [file.type, fileStream.bytesRead, file.creationDate, file.usedDate, oid, userId]
                        }).then(function () {
                            return resolve(new Response(status.Ok, {attachmentId: uri}));
                        }).catch(function (err) {
                            return reject(errors.InternalErrorResponse());
                        });
                    });
                    stream.on('error', function (err) {
                        console.log("errr rjected: " + err);
                        return reject(err);
                    });
                });
            }).catch(function (err) {
                console.log("interanl creating read stream: " + util.inspect(err));
                cb(errors.InternalErrorResponse());
            });
    }).then(function (response) {
        cb(response);
    }).catch(function (err) {
        console.log("last error! " + util.inspect(err));
        cb(errors.InternalErrorResponse());
    });
};

/*const uploadAvatar = function (pgpClient, req, res, cb) {
 if (validateData.isUndefined(req.file) || req.files.length == 0) {
 cb(new ErrorResponse(status.BadRequest, messages.NoFileAttached));
 }
 else {
 uploaderAvatar(req, res, function (err) {
 if (err) {
 console.log("uploading avatar error: " + util.inspect(err));
 if (err.code == "LIMIT_UNEXPECTED_FILE")
 cb(new ErrorResponse(status.BadRequest, messages.ExceededLimitFilesUpload));
 else
 cb(new ErrorResponse(status.BadRequest, err.message));
 }
 else {
 return pg.connect(dbpg.connectionString())
 .then(function (client, done) {
 const man = new LargeObjectManager({pg: client});
 client.query('BEGIN', function (err, result) {
 if (err) {
 done(err);
 client.emit("err", err);
 }
 else {
 const bufferSize = 16384;
 const field = filesDataContent.pop();
 man.createAndWritableStream(bufferSize, function (err, oid, stream) {
 if (err) {
 done(err);
 return console.error('Unable to crear a new large object ', err);
 } else {

 console.log('Creating a new large object ', oid);
 let fileStream = fs.createReadStream(constants.TEMP_PATH_UPLOADS + field.filename);
 fileStream.pipe(stream);

 stream.on('finish', function () {
 client.query('COMMIT', done);
 client.query({
 name: "insert data_content ",
 text: "INSERT INTO data_content(type, length, creation_date, used_date, oid, user_id) " +
 "VALUES($1, $2, $3, $4, $5, $6)",
 values: [field.type, fileStream.bytesRead, field.creationDate, field.usedDate, oid, req.user['id']]
 }).on('end', function () {
 cb(new Response(status.Ok, {avatar: generateFileUri(req.user['id'], oid)}));
 pg.end();
 //client.end();
 });
 });
 }
 })
 }
 });
 }).catch(function (e) {
 cb(new ErrorResponse(status.InternalError, messages.InternalServerError));
 });
 }
 });
 }
 };*/

module.exports = {
    uploadAvatar: uploadAvatar,
    uploadImages: uploadImages
};