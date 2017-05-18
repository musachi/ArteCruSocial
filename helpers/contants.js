let constants = function () {};

constants.MAX_PASSWORD_CHARACTERS = 32;
constants.MIN_PASSWORD_CHARACTERS = 6;
constants.MAX_EMAIL_CHARACTERS = 64;
constants.MIN_EMAIL_CHARACTERS = 6;

constants.EXPIRATION_TOKEN_IN_SECONDS = 3 * 24 * 60 * 60;
constants.SECRET = "Triathlon*/ArteCru2017";
constants.GET_USERS_COUNTER = 20;

constants.UNDEFINED = 'undefined';

const arts = function()
{
    const arts = ['Paint', 'Music', 'Sculpture', 'Architecture', 'Literature', 'Dance', 'Cinema', 'Other'];
    return arts;
};

module.exports = {
    constants: constants,
    arts: arts
};



