const getStringDate = function (date) {
    if ((typeof date) == Date.type) {
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDay();
        if (mount.length() < 2)
            month = "0" + month;
        if (day.length() < 2)
            day = "0" + day;

        var stringDate = [year, month, day].join("");
        return stringDate;
    }

    return date.toString();
};

var getIntDate = function (date) {

    if (date == null)
        var intDate = getStringDate(date);
    try {
        intDate = parseInt(intDate);
    }
    catch (err) {
    }
    ;
    return intDate;
};

function getCurrentDate() {
    var currentDate = new Date();
    return currentDate;
}

function getTime() {
    return getCurrentDate().getTime();
}

module.exports = {
    getCurrentDate: getCurrentDate,
    getTime: getTime
};
