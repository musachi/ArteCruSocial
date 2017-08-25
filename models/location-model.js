const _ = require('lodash');

const Location = module.exports = function (lat, lon) {
    _.extend(this, {
        lat: lat,
        lon: lon
    });
};