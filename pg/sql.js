const util = require('util');

const insertMessage = function () {
    return "INSERT INTO messages (owner_user_id, target_id, message_type, text, attachment_id, time, location) " +
        "VALUES(${owner_user_id}, ${target_id}, ${message_type}, ${text}, ${attachment_id}, ${time}, ${location}) RETURNING id";
};

//TODO offset y limit by defautl in constants and last indes
const getLastMessages = function () {
    return "SELECT messages.*, data_content.type FROM messages LEFT JOIN " +
        "data_content ON data_content.oid = messages.attachment_id WHERE target_id = ${user_id} " +
        "AND messages.id > ${last_message_index} " +
        "ORDER BY time DESC OFFSET ${offset} LIMIT ${limit}";
};

const getConverstionMessages = function () {
    return "SELECT messages.*, data_content.type FROM messages LEFT JOIN " +
        "data_content ON data_content.oid = messages.attachment_id WHERE ((target_id = ${user_id} AND owner_user_id = ${owner_user_id}) " +
        "OR ((target_id = ${owner_user_id} AND owner_user_id = ${user_id})" +
        "ORDER BY time DESC OFFSET ${offset} LIMIT ${limit}";
};

const getConverstion = function () {
    return "SELECT messages.*, messages.owner_user_id FROM messages " +
        "WHERE ((target_id = ${user_id} AND owner_user_id = ${owner_user_id}) " +
        "OR ((target_id = ${owner_user_id} AND owner_user_id = ${user_id})" +
        "ORDER BY time DESC OFFSET ${offset} LIMIT ${limit}";
};



const upsertLastIndexRequest = function () {
    return "INSERT INTO user_message(user_id, last_index_request) VALUES(${user_id}, ${last_index_request}) ON CONFLICT (user_id) " +
        "DO UPDATE SET user_id = ${user_id}, last_index_request = ${last_index_request}";
};

const getNewMessagesCount = function () {

};


const insertDataContent = function () {
    return "INSERT INTO data_content(type, length, creation_date, used_date, oid, user_id) " +
        "VALUES($1, $2, $3, $4, $5, $6)";
};

module.exports = {
    insertMessage: insertMessage,
    getLastMessages: getLastMessages,
    upsertLastIndexRequest: upsertLastIndexRequest,
    insertDataContent, insertDataContent
};
//const getLastMessages()