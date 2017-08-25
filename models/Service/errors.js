const ErrorResponse = require('./error-response');
const status = require('./status');
const messages = require('../../helpers/messages').messages;

const InternalErrorResponse = function (message) {
    let error_message = messages.InternalServerError;
    if (arguments.length > 0)
        error_message = message;
    return new ErrorResponse(status.InternalError, error_message);
};

const BadRequestErrorResponse = function (message) {
    let error_message = "";
    if (arguments.length > 0)
        error_message = message;
    return new ErrorResponse(status.BadRequest, error_message);
};

const ForbiddenErrorResponse = function (message) {
    let error_message = "";
    if (arguments.length > 0)
        error_message = message;
    return new ErrorResponse(status.Forbidden, error_message);
};

module.exports = {
    InternalErrorResponse: InternalErrorResponse,
    BadRequestErrorResponse: BadRequestErrorResponse,
    ForbiddenErrorResponse: ForbiddenErrorResponse
};