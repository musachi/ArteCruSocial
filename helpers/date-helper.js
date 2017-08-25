const util = require('util');
const validateData = require('./validate-data');

const convertDateToUTC = function (date) {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
};

const getStringDate = function (d, separator) {
    date = convertDateToUTC(d);
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    console.log("fulldate: " + date.toString());
    console.log("year: " + year + " month: " + month + " day: " + day);
    if (month.toString().length < 2)
        month = "0" + month.toString();
    if (day.toString().length < 2)
        day = "0" + day.toString();

    if (validateData.findUndefined([month, day, year]))
        return getCurrentDate().join("");
    return [year, month, day].join(separator || "");
};

const getCurrentStringDate = function (separator) {
    return getStringDate(getCurrentDate(), separator);
};

const getIntDate = function (date) {
    date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    let intDate = -1;
    if (date == null)
        intDate = getStringDate(date, "");
    try {
        intDate = parseInt(intDate);
    }
    catch (err) {
    }
    return intDate;
};

function getCurrentDate() {
    return convertDateToUTC(new Date());
}

function getTime() {
    return getCurrentDate().getTime();
}

module.exports = {
    getCurrentDate: getCurrentDate,
    getTime: getTime,
    getStringDate: getStringDate,
    getCurrentStringDate: getCurrentStringDate
};
