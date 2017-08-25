let status = function () {
};

status.Ok = 200;
status.Created = 201;
status.NoContent = 204;
status.BadRequest = 400;

status.Unauthorized = 401;
status.InvalidCredentials = 4011;

status.OptionsResponse = 304;

status.Forbidden = 403;
status.NotFound = 404;
status.MethodNotAllowed = 405;
status.Gone = 410;

status.UnprocessableEntity = 422;
status.InvalidEmail = 4221;
status.InvalidPassowrd = 4222;
status.InvalidName = 4223;

status.TooManyRequests = 429;

status.InternalError = 500;

//custom errors.js
status.DuplicatedEmail = 700;

module.exports = status;