const uuid = require('uuid');
const randomstring = require("randomstring");
const _ = require('lodash');
const crypto = require('crypto');

let User = require('../neo4j_model/user');
let LoginResult = require('../Service/login-result');
const status = require('../Service/status');
const Cypher = require('../../neo4j/cypher');
const constants = require('../../helpers/contants').constants;
const dateHelper = require('../../helpers/date-helper');
const jwt = require('jsonwebtoken');
const arts = require('../../helpers/contants').arts();
const util = require('util');
let Response = require('../Service/response');
let ErrorResponse = require('../Service/error-response');
const messages = require('../../helpers/contants').messages;
const errors = require('../Service/errors');
const invitationStatus = require('../Service/invitation-status');
const validateData = require('../../helpers/validate-data');
const PersonalProfile = require('../neo4j_model/personal-profile');

var getPersonalProfile = function (session, id) {
    return session.run(Cypher.getPersonalProfile(), {
        id: id
    }).then(function getPersonalProfileCallback(results) {
        if (results.records.length > 0) {
            let personalProfile = new PersonalProfile(results.records[0].get('personal'));
            personalProfile.name = results.records[0].get('name');
            return personalProfile;
        }
    }).catch(function getPersonalInfoError(err) {
        console.log("model error get personal info: " + util.inspect(err));
        throw new Error;
    });
};

var updatePersonalProfile = function (session, id, name, website, gender, phone, birthday) {
    return session.run(Cypher.updatePersonalProfile(), {
        id: id,
        name: name,
        website: website,
        gender: gender,
        phone: phone,
        birthday: birthday
    }).then(function updatePersonalProfileCallback(results) {
        if (results.records.length > 0) {
            let personal_profile = new PersonalProfile(results.records[0].get('personal_profile'));
            personal_profile.name = results.records[0].get('name');
            console.log("update personal profile: " + util.inspect(personal_profile));
            return personal_profile;
        }
        return errors.BadRequestErrorResponse;
    }).catch(function updatePersonalProfileError(err) {
        console.log("model error updating personal profile: " + util.inspect(err));
        throw new Error;
    });
};

module.exports = {
    getPersonalProfile: getPersonalProfile,
    updatePersonalProfile: updatePersonalProfile
};