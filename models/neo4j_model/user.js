/**
 * Created by Adonys on 3/15/2017.
 */

const _ = require('lodash');
const md5 = require('md5');
const avatar_url = '';
const validate_data = require('../../helpers/validate-data');

var User = module.exports = function (_node, _art, _arts) {

    let id = "";
    let email = "";
    let name = "";
    let avatar = '';
    let art = "";
    let arts = "";

    if (arguments.length > 0) {
        if (!_node.isUndefined && _node != null) {
            id = _node.properties['id'];
            email = _node.properties['email'];
            name = _node.properties['name'];
            avatar = _node.properties['avatar'];
        }

        if (arguments.length > 1) {
            if (!validate_data.isUndefined(art))
                art = _art;
        }

        if (arguments.length > 2) {
            if (!validate_data.isUndefined(arts))
                arts = _arts;
        }
    }

    _.extend(this, {
        'email': email,
        'id': id,
        'name': name,
        'avatar': avatar,
        'art': art,
        'arts': arts
    });

    function setArts(arts) {
        this['arts'] = arts;
    }
};


