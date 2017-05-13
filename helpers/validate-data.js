/**
 * helpers
 * @type {constants}
 */

var constants = require('./contants').constants;
var arts = require('./contants').arts();

function IsValidPassword(password) {
    return password.length >= parseInt(constants.MIN_PASSWORD_CHARACTERS) && password.length <= parseInt(constants.MAX_PASSWORD_CHARACTERS);
}

function IsValidEmail(email) {
    return email.length >= parseInt(constants.MIN_EMAIL_CHARACTERS) && email.length <= parseInt(constants.MAX_EMAIL_CHARACTERS);
}

function isUndefined(field) {
    return typeof field === constants.UNDEFINED;
}

function findUndefined(fields) {
    var found_undefined = false;

    var i = 0;
    while (!found_undefined && i < fields.length) {
        if (isUndefined(fields[i++]))
            found_undefined = true;
    }

    return found_undefined;
}

//TODO validate id

//TODO expresion regular para validar un nombre o un alias, nombre
function isValidName(name) {
    return true;
}

function isValidArtValue(art_number) {
    if (art_number >= 0 && art_number < arts.length)
        return true;
    return false;
}

module.exports = {
    isValidEmail: IsValidEmail,
    isValidPassword: IsValidPassword,
    isUndefined: isUndefined,
    findUndefined: findUndefined,
    isValidName: isValidName,
    isValidArtValue: isValidArtValue

};