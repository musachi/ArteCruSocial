/**
 * Created by Adonys on 5/9/2017.
 */

const _ = require('lodash');
const md5 = require('md5');
const avatar_url = 'https://www.gravatar.com/avatar/';
const validate_data = require('../../helpers/validate-data');

const Invitation = module.exports = function (_rel, user_id) {

    _.extend(this, {
        'created_at': _rel.properties['created_at'],
        'updated_at': _rel.properties['updated_at'],
        'status': _rel.properties['status'],
        'user_id': user_id
    });
};