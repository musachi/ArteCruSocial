const _ = require('lodash');
const md5 = require('md5');
const avatar_url = '';
const validate_data = require('../../helpers/validate-data');
const util = require('util');

//TODO only show last 2 responses
//TODO in swagger invitations count or partners count
const Post = module.exports = function (_node, _art, _nice_count, _responses, _responses_count, _attachment, _nice_users, user) {
    if (_node) {
        _.extend(this, {
            'time': _node.properties['time'],
            'text': _node.properties['text']
        });
    }

    let own_attachment = {};
    if (_attachment) {
        console.log("_attachment: " + util.inspect(_attachment));
        own_attachment = _attachment.properties;
    }
    _.extend(this, {
        art: _art,
        nice_count: _nice_count,
        responses: _responses,
        responses_count: _responses_count,
        attachment: own_attachment,
        user: user
    });

    if (_nice_users) {
        _.extend(this, {
            nice_users: _nice_users
        });
    }
};
