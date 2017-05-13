const ErrorResponse = require('./error-response');
const status = require('./status');
const messages = require('../../helpers/messages').messages;

const InternalErrorResponse = function () {
    return new ErrorResponse(status.InternalError, status.InternalErrorCode, messages.InternalServerError);
};

const BadRequestErrorResponse = function(){
    return new ErrorResponse(status.BadRequest, "", "");
};

const ForbiddenErrorResponse = function()
{
    return new ErrorResponse(status.Forbidden, "", "");
};

module.exports = {
    InternalErrorResponse: InternalErrorResponse,
    BadRequestErrorResponse: BadRequestErrorResponse,
    ForbiddenErrorResponse: ForbiddenErrorResponse
};