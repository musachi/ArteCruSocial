
const _ = require('lodash');
const md5 = require('md5');
const avatar_url = '';
const validate_data = require('../../helpers/validate-data');

const Attachment = module.exports = function(_node)
{
    _.extend(this, _node.properties);
};