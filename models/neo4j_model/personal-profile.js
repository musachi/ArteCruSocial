/**
 * Created by Adonys on 5/18/2017.
 */

const _ = require('lodash');

var PersonalProfile = module.exports = function(_personal_profile)
{
    _.extend(this, _personal_profile.properties);

};