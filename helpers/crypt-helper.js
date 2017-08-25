
const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const password = 'PlaySecret*/2017!';


function encrypt(text) {
    const cipher = crypto.createCipher(algorithm, password);
    let crypted = cipher.update(text, 'utf-8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    const decipher = crypto.createDecipher(algorithm, password);
    let dec = decipher.update(text, 'hex', 'utf-8');
    dec += decipher.final('utf-8');
    return dec
}

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt
};