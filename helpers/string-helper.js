exports.containString = function (mainString, subString) {
    const regularExpression = new RegExp(subString);
    return regularExpression.test(mainString);
};