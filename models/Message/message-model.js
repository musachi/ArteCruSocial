/**
 * message model
 */
const messagesType = require('../../helpers/contants').message_type;
const _ = require('lodash');
const uriHelper = require('../../helpers/uri-helper');


const Message = module.exports = function (owner_id, target_id, message_type, time, text, attachment_id, location, attachment) {
    _.extend(this, {
        owner_id: owner_id,
        target_id: target_id,
        message_type: message_type,
        time: time,
        text: null,
        attachment_id: null,
        location: null,
        attachment: null
    });

    if (parseInt(message_type) == messagesType.location && location)
        this.location = location;
    else {
        if (parseInt(message_type) == messagesType.attachment.toString() || attachment_id)
            this.attachment_id = uriHelper.getOidFromResourceId(attachment_id);
        if (parseInt(attachment))
            this.attachment = attachment;
    }
    if (parseInt(message_type) == messagesType.text || text)
        this.text = text;
};
