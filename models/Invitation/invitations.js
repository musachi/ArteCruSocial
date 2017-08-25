/**
 * Invitations model
 */

"use strict";

const uuid = require('uuid');
const randomstring = require("randomstring");
const _ = require('lodash');
const crypto = require('crypto');

const User = require('../neo4j_model/user');
const LoginResult = require('../Service/login-result');
const status = require('../Service/status');
const Cypher = require('../../neo4j/cypher');
const constants = require('../../helpers/contants').constants;
const dateHelper = require('../../helpers/date-helper');
const jwt = require('jsonwebtoken');
const arts = require('../../helpers/contants').arts();
const util = require('util');
const Response = require('../Service/response');
const ErrorResponse = require('../Service/error-response');
const messages = require('../../helpers/messages').messages;
const errors = require('../Service/errors');
const invitationStatus = require('../Service/invitation-status').invitationStatus;
const validateData = require('../../helpers/validate-data');
const Invitation = require('../neo4j_model/invitation');

const sendInvitation = function (session, id, user_id) {
    const invitation_status = invitationStatus.Wait;
    const updated_at = dateHelper.getTime();
    console.log("id: " + id);
    console.log("partner_id: " + user_id);
    return session.run(Cypher.createInvitation(),
        {
            id: id,
            user_id: user_id,
            updated_at: updated_at,
            invitation_status: invitation_status
        })
        .then(function (results) {
            return new Invitation(results.records[0].get('rel'), results.records[0].get('user_id'));
        }).catch(function (err) {
            console.log("Error sending partner : " + util.inspect(err));
            throw new Error;
        });
};

const getInvitations = function (session, offset, limit, id) {
    return session.run(Cypher.getInvitations(), {
        offset: offset,
        limit: limit,
        id: id
    }).then(function getInvitationsCallback(results) {
        let response = "";
        if (!validateData.isUndefined(results.records)) {
            response = _.map(results.records, record => {
                let rel = record.get('partner_rel').properties;
                rel.user = new User(record.get('partner'), arts.indexOf(record.get('art')));
                console.log("relation: " + rel);
                return rel;
            });
        }
        return response;
    }).catch(function (err) {
        console.log("error getting invitations: " + util.inspect(err));
        throw Error;
    });
};

const getInvitationsSent = function (session, offset, limit, id) {

    return session.run(Cypher.getInvitationsSent(), {
        offset: offset,
        limit: limit,
        id: id
    }).then(function getInvitationsCallback(results) {
        let response = "";
        if (!validateData.isUndefined(results.records)) {
            response = _.map(results.records, record => {
                let r = record.get('partner_rel').properties;
                r.user_id = record.get('user_id');
                return r;
            });
        }
        return response;
    }).catch(function (err) {
        console.log("error getting invitations: " + util.inspect(err));
        throw Error;
    });
};

const countInvitations = function (session, id) {
    console.log("entering to invitations module");
    return session.run(Cypher.countInvitations(), {
        id: id
    }).then(function countInvitationsResults(results) {
        if (!validateData.isUndefined(results.records)) {
            console.log("invitations: " + results.records[0]._fields[0].low);
            return results.records[0]._fields[0].low;
        }
        else {
            console.log("undefined count invitations: " + 0);
            return 0;
        }
    }).catch(function countInvitationsError(err) {
        console.log(util.inspect(err));
        throw new Error;
    });
};

const countInvitationsSent = function (session, id) {
    console.log("id: " + id);
    return session.run(Cypher.countInvitationsSent(), {
        id: id
    }).then(function countInvitationsResults(results) {
        if (!validateData.isUndefined(results.records)) {
            return results.records[0]._fields[0].low;
        }
        else
            return new Response(status.Ok, '0');
    }).catch(function countInvitationsError(err) {
        console.log(util.inspect(err));
        throw new Error;
    });
};

const findInvitationById = function (session, current_user_id, user_id) {
    return session.run(Cypher.findInvitationById(), {
        id: current_user_id,
        user_id: user_id
    }).then(function findInvitationCallback(results) {
        if (results.records.length > 0) {
            let r = "";
            const record = results.records[0];
            const partner_rel_sent = record.get('partner_rel_sent');
            const partner_rel_received = record.get('partner_rel_received');
            const user_id = record.get('user_id');

            if (partner_rel_received != null) {
                r = new Invitation(partner_rel_received, user_id);
                r.invitation_sent = true;
            }
            else {
                r = new Invitation(partner_rel_received, user_id);
                r.invitation_sent = true;
            }
        }
        else
            return "";
    }).catch(function findINvitationCallback() {
        console.log("model error finding user: " + util.inspect(err));
        throw new Error;
    });
};

const acceptInvitation = function (session, id, user_id) {
    const updated_at = dateHelper.getTime();
    return session.run(Cypher.acceptInvitation(), {
        id: id,
        user_id: user_id,
        updated_at: updated_at,
        status: invitationStatus.Accept
    }).then(function acceptInvitationCallback(response) {
        if (response.records.length > 0)
            return true;
        return false;
    }).catch(function acceptInvitationError(err) {
        console.log("model accept invitation error: " + util.inspect(err));
        throw new Error;
    });
};

const deleteInvitation = function (session, id, user_id) {
    return session.run(Cypher.deleteInvitation(), {
        id: id,
        user_id: user_id
    }).then(function deleteInvitationCallback(response) {
        if (response.records.length > 0)
            return true;
        return false;
    }).catch(function deleteInvitationError(err) {
        console.log("model accept invitation error: " + util.inspect(err));
        throw new Error;
    });
};

module.exports = {
    sendInvitation: sendInvitation,
    getInvitations: getInvitations,
    getInvitationsSent: getInvitationsSent,
    countInvitations: countInvitations,
    countInvitationsSent: countInvitationsSent,
    findInvitationById: findInvitationById,
    acceptInvitation: acceptInvitation,
    deleteInvitation: deleteInvitation
};
