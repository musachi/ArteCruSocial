const arts = require('./contants').arts();
const messages = function () {};

messages.DuplicateEmail = "Email already registered";
messages.InternalServerError = "Internal server error";
messages.InvalidEmail = "Invalid email";
messages.InvalidadCredentials = "Email or password incorrect";
messages.InvalidToken = "Invalid token";
messages.InvalidPassword = "Invalid password";
messages.InvalidName = "Invalid name must contain just letters";
messages.InvalidArt = "Invalid art, must be a number from 0 to 6 (" + arts.join(" ") + ")";
messages.UploadingError = "Error uploading data";
messages.ExceededLimitFilesUpload = "Exceeded limit files per upload";
messages.NoFileAttached = "No file attached";
messages.ErrorSavingFile = "Error saving file";

messages.OnlyImages = "Only images are allowed";
messages.OnlyMusic = "Only music are allowed";
messages.OnlySomeDocsType = "Only some docs file type are allowed";
messages.OnlyVideo = "Only some videos type are allowed";

messages.AlreadyNicePost = "Already nice post";


module.exports = {
    messages: messages
};