let constants = function () {
};

constants.MAX_PASSWORD_CHARACTERS = 32;
constants.MIN_PASSWORD_CHARACTERS = 6;
constants.MAX_EMAIL_CHARACTERS = 64;
constants.MIN_EMAIL_CHARACTERS = 6;

constants.EXPIRATION_TOKEN_IN_SECONDS = 3 * 24 * 60 * 60;
constants.SECRET = "Triathlon*/ArteCru2017";
constants.SECRET_MESSAGES = "4rt3Cru-2017*/tri";
constants.GET_USERS_LIMIT = 20;
constants.GET_POSTS_LIMIT = 10;
constants.MIN_LENGH_FIELD_SEARCH = 3;

constants.UNDEFINED = 'undefined';

//upload files
constants.MAX_FILES_AVATAR_UPLOAD = 1;
constants.MAX_FILES_UPLOAD = 3;
constants.MAX_FILES_AVATAR_SIZE = 1204 * 1024; //bytes
constants.TEMP_PATH_UPLOADS = './tmp/uploads/';
constants.TEMP_PATH_FILES = './tmp/files/';

const arts = function () {
    return ['Paint', 'Music', 'Sculpture', 'Architecture', 'Literature', 'Dance', 'Cinema'];
};

const gender = function () {
};
gender.female = 0;
gender.male = 1;

let image_status = function () {
};
image_status.allowed = 0;
image_status.blocked = 1;

const file_mimetypes = function () {
};
file_mimetypes.image = ["image/jpg", "image/png", "image/jpeg", "image/gif", "image/bmp", "image/x-icon"];
file_mimetypes.audio = ["audio/mpeg", "audio/mp3", "audio/wmv", "audio/ogg"];
file_mimetypes.doc = ["application/pdf", "doc", "text/plain", "text/plain"];
file_mimetypes.video = ["video/mpeg", "video/mpeg", "video/mp4", "video/avi"];

const file_extensions = function () {
};
file_extensions.image = ['.jpg', '.png', '.jpeg', '.gif', '.bmp', '.ico'];
file_extensions.audio = ['.mpeg', '.mp3', '.wmv', '.ogg'];
file_extensions.doc = ['.pdf', '.doc', '.docx', '.txt'];
file_extensions.video = ['.mpeg', '.mpeg', '.mp4', '.avi'];

const file_type = function () {
};
file_type.image = 0;
file_type.audio = 1;
file_type.doc = 2;
file_type.video = 3;

const message_type = function(){};
message_type.text = 0;
message_type.attachment = 1;
message_type.location = 2;

module.exports = {
    constants: constants,
    arts: arts,
    gender: gender,
    image_status: image_status,
    file_mimetypes: file_mimetypes,
    file_extensions: file_extensions,
    file_type: file_type,
    message_type: message_type
};