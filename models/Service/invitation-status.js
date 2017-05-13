/**
 * Created by Adonys on 4/13/2017.
 */

var invitationStatus = function()
{
};

//status for invitations.js
invitationStatus.Wait = 0;     //invitation sent to possible partner
invitationStatus.Accept = 1;    //acept partner invitation
invitationStatus.Denied = 2;     //denied invitation, do not approve partner invitations.js

module.exports = {
    invitationStatus: invitationStatus
};
