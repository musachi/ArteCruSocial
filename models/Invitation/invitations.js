/**
 * Invitations model
 */

"use strict";

var uuid = require('uuid');
var randomstring = require("randomstring");
var _ = require('lodash');
var crypto = require('crypto');

var User = require('../neo4j_model/user');
var LoginResult = require('../Service/login-result');
var status = require('../Service/status');
var Cypher = require('../../neo4j/cypher');
var constants = require('../../helpers/contants').constants;
var dateHelper = require('../../helpers/date-helper');
var jwt = require('jsonwebtoken');
var arts = require('../../helpers/contants').arts();
var util = require('util');
var Response = require('../Service/response');
var ErrorResponse = require('../Service/error-response');
var messages = require('../../helpers/messages').messages;
var errors = require('../Service/errors');
var invitationStatus = require('../Service/invitation-status').invitationStatus;
var validateData = require('../../helpers/validate-data');
var Invitation = require('../neo4j_model/invitation');

var sendInvitation = function (session, id, user_id) {
    const invitation_status = invitationStatus.Wait;
    const updated_at = dateHelper.getTime();
    return session.run(Cypher.createInvitation(),
        {
            id: id,
            user_id: user_id,
            updated_at: updated_at,
            invitation_status: invitation_status
        })
        .then(function (results) {
            var response = results.records[0].get('rel').properties;
            return response
        }).catch(function (err) {
            console.log("Error sending partner : " + util.inspect(err));
            throw new Error;
        });
};

var getInvitations = function (session, offset, limit, id) {

    return session.run(Cypher.getInvitations(), {
        offset: offset,
        limit: limit,
        id: id
    }).then(function getInvitationsCallback(results) {
        var response = "";
        if (!validateData.isUndefined(results.records)) {
            response = _.map(results.records, record => {
                var rel = record.get('partner_rel').properties;
                rel.user = new User(record.get('partner'), arts.indexOf(record.get('art')));
                return rel;
            });
        }
        return response;
    }).catch(function (err) {
        console.log("error getting invitations: " + util.inspect(err));
        throw Error;
    });
};

var getInvitationsSent = function (session, offset, limit, id) {

    return session.run(Cypher.getInvitationsSent(), {
        offset: offset,
        limit: limit,
        id: id
    }).then(function getInvitationsCallback(results) {
        var response = "";
        if (!validateData.isUndefined(results.records)) {
            response = _.map(results.records, record => {
                var r = record.get('partner_rel').properties;
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

var countInvitations = function (session, id) {
    console.log("count invitations: " + Cypher.countInvitations());
    return session.run(Cypher.countInvitations(), {
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

var countInvitationsSent = function (session, id) {
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

var findInvitationById = function (session, current_user_id, user_id) {
    return session.run(Cypher.findInvitationById(), {
        id: current_user_id,
        user_id: user_id
    }).then(function findInvitationCallback(results) {
        if (results.records.length > 0) {
            var r = "";
            var record = results.records[0];
            var partner_rel_sent = record.get('partner_rel_sent');
            var partner_rel_received = record.get('partner_rel_received');
            var user_id = record.get('user_id');

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

var acceptInvitation = function (session, id, user_id) {
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

var deleteInvitation = function (session, id, user_id) {
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
