const crypt = require('./crypt-helper');
const nconf = require('../config');

const file_path = "download";

exports.generateFileResourceId = function (userId, oid) {
    const textToEncrypt = userId + "_" + oid;
    return crypt.encrypt(textToEncrypt);
};

exports.generateFileResourceUri = function (userId, oid, path) {
    let uri = "http://" + nconf.get('HOST') + ":" + nconf.get('PORT') + "/" + path + "?id=" + this.generateFileResourceId(userId, oid);
    return uri;
};

exports.generateFileUri = function (userId, oid) {
    return this.generateFileResourceUri(userId, oid, file_path);
};

exports.getOidFromResourceId = function(resource_id)
{
    const array = crypt.decrypt(resource_id).split('_');
    return array.pop();
};
