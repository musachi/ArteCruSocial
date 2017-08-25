/**
 * Created by Artecru on 19/8/2017.
 */

const messagesType = require('../../helpers/contants').message_type;
const _ = require('lodash');
const uriHelper = require('../../helpers/uri-helper');


const UserWsConnection = module.exports = function (ws) {
    _.extend(this, {
        ws: ws,
        conversations: []
    });
};
