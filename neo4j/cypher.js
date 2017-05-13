const invitationStatus = require('../models/Service/invitation-status').invitationStatus;

/**
 * Constraint para los campos que son unicos en cada nodo (indexados)
 * @returns {string}
 * @constructor
 */
const createUniqueConstraint = function () {
    return ['CREATE CONSTRAINT ON (l:Art) ASSERT l.name IS UNIQUE',
        'CREATE CONSTRAINT ON (u:User) ASSERT u.id IS UNIQUE',
        'CREATE CONSTRAINT ON (c:User) ASSERT c.username IS UNIQUE',
        'CREATE CONSTRAINT ON (l:User) ASSERT l.email IS UNIQUE',
        'CREATE CONSTRAINT ON (h:User) ASSERT h.token IS UNIQUE'];
};

/**
 * Create the 7th Arts with name like primary key
 * @returns {string}
 * @constructor
 */
const createArts = function () {
    return 'CREATE (paint:Art {name: "Paint"}), (music:Art {name: "Music"}), ' +
        '(sculpture:Art {name: "Sculpture"}), (architecture:Art {name: "Architecture"}), ' +
        '(literature:Art {name: "Literature"}), (dance:Art {name: "Dance"}), (cinema:Art {name: "Cinema"})';
};

/**
 * @returns {string}
 * @constructor
 */
const getArts = function () {
    return 'MATCH (art:Art) RETURN art';
};

const createUser = function () {
    return ['MATCH (art:Art {name: {art}}) ',
        'MERGE (user:User {id: {id}, email: {email}, password: {password}, name: {name}, created_at: {created_at}})',
        'MERGE (user)-[:PERSONAL_PROFILE]->(personal:PersonalProfile) ',
        'MERGE (user)-[:PROFESSIONAL_PROFILE]->(professional:ProfessionalProfile)-[know:HAS_ART {main: true}]->(art) ',
        'RETURN user, art.name AS art'].join('\n');
};

const updateUser = function () {
    return ['MATCH (user:User {id: {id}}) ',
        'SET user.name = {name}, user.email = {email} ',
        'RETURN user'].join('\n');
};

const getUserById = function () {
    return ['MATCH (user:User {id: {id}})-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'RETURN user, art.name AS art'].join('\n');
};

const getUserByEmail = function () {
    return ['MATCH (user:User {email: {email}})-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'RETURN user, art.name AS art'].join('\n');
};


const getUsersByEmail = function () {
    return ['MATCH (user:User)-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'WHERE user.email CONTAINS lower(trim({email})) ',
        'RETURN user, art.name AS art ORDER BY user.name SKIP {start} LIMIT {counter}'].join('\n');
};

const findUsersByName = function () {
    return ['MATCH (user:User)-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'WHERE lower(trim(user.name)) CONTAINS lower(trim({name})) ',
        'RETURN user, art.name AS art ORDER BY user.name SKIP {start} LIMIT {counter}'].join('\n');
};

const findUsers = function () {
    return ['MATCH (user:User)-[relation]->(profile) ',
        'MATCH (me:User {id: {id}})',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'WHERE lower(trim(user.name)) CONTAINS lower(trim({field})) OR user.email CONTAINS lower(trim({field}))',
        'OPTIONAL MATCH (me)-[partner_rel_sent: IS_PARTNER]->(user) ',
        'OPTIONAL MATCH (me)<-[partner_rel_received: IS_PARTNER]-(user) ',
        'RETURN DISTINCT user, partner_rel_sent, partner_rel_received, art.name AS art ORDER BY user.name SKIP {start} LIMIT {counter}'].join('\n');
};

const findUsersByArt = function () {
    return ['MATCH (user:User)-[relation]->(profile) ',
        'MATCH (me:User {id: {id}})',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'WHERE lower(trim(user.name)) CONTAINS lower(trim({field})) OR user.email CONTAINS lower(trim({field}))',
        'MATCH (user)-[PROFESSIONAL_PROFILE]->(p)-[HAS_ART {main:true}]->(art:Art {name: {art}})',
        'OPTIONAL MATCH (me)-[partner_rel_sent: IS_PARTNER]->(user) ',
        'OPTIONAL MATCH (me)<-[partner_rel_received: IS_PARTNER]-(user) ',
        'RETURN DISTINCT user, partner_rel_sent, partner_rel_received, art.name AS art ORDER BY user.name SKIP {start} LIMIT {counter}'].join('\n');
};

const getUsers = function () {
    return ['MATCH (user:User)-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'RETURN user, art.name AS art ORDER BY user.name SKIP {start} LIMIT {counter}'].join('\n');
};

const login = function () {
    return ['MATCH (user:User {email: {email}, password: {password}}) ',
        'MATCH (user)-[:PERSONAL_PROFILE]->(personal) ',
        'MATCH (user)-[:PROFESSIONAL_PROFILE]->(professional) ',
        'MATCH (professional)-[:HAS_ART {main: true}]->(art) ',
        'RETURN user, art.name AS art'].join('\n');
};

const me = function () {
    return ['MATCH (user:User {token}) ',
        'MATCH (user)-[:PERSONAL_PROFILE]->(personal) ',
        'MATCH (user)-[:PROFESSIONAL_PROFILE]->(professional) ',
        'MATCH (professional)-[:HAS_ART {main: true}]->(art) ',
        'RETURN user, art'
    ].join("\n");
};

/**
 * Invitations
 * create and upodate invitation
 * @return {string}
 */
const createInvitation = function () {
    return ['MATCH (user:User {id: {id}}), (partner:User {id: {user_id}}) ',
        'MERGE (user)-[rel:IS_PARTNER]->(partner) ',
        'ON CREATE SET rel += {status: {invitation_status}, created_at: {updated_at}, updated_at: {updated_at}} ',
        'ON MATCH SET rel += {status: {invitation_status}, updated_at: {updated_at}}',
        'RETURN rel'].join('\n');
};

const countInvitationsSent = function () {
    return ['MATCH (user:User {id: {id}})',
        'MATCH (user)-[rel:IS_PARTNER]->(partner) ',
        'RETURN COUNT(partner) AS invitations_sent ',].join('\n');
};

const getInvitationsSent = function () {
    return ['MATCH (user:User {id: {id}}) ',
        'MATCH (user)-[partner_rel:IS_PARTNER]->(partner:User)',
        'RETURN partner_rel, partner.id AS user_id ' + sortPaginator('partner_rel.updated_at')].join('\n');
};

const countInvitations = function () {
    return ['MATCH (user:User {id: {id}}) ',
        'MATCH (user)<-[partner_rel:IS_PARTNER {status: ' + invitationStatus.Wait + '}]-(partner:User) ',
        'RETURN COUNT(partner) AS invitations'].join('\n');
};

const getInvitations = function () {
    return ['MATCH (user:User {id: {id}}), (partner:User)-[:PROFESSIONAL_PROFILE]->(pro)-[:HAS_ART {main: true}]->(art:Art) ',
        'MATCH (user)<-[partner_rel:IS_PARTNER {status: ' + invitationStatus.Wait + '}]-(partner)',
        'RETURN partner_rel, partner, art.name AS art ' + sortPaginator('partner_rel.updated_at')].join('\n');
};

const findInvitationById = function () {
    return ['MATCH (user:User {id: {id}}), MATCH (partner:User {id: {user_id}})',
        'OPTIONAL MATCH (user)-[partner_rel_sent:IS_PARTNER]->(partner) ',
        'OPTIONAL MATCH (user)-[partner_rel_received:IS_PARTNER]-(partner) ',
        'RETURN partner_rel_sent, partner_rel_received, partner.id AS user_id ' + sortPaginator('partner_rel.updated_at')].join('\n');
};

const acceptInvitation = function () {
    return ['MATCH (user:User {id: {id}}), (partner:User {id: {user_id}}) ',
        'MATCH (user)<-[rel:IS_PARTNER]-(partner) ',
        'SET rel += {status: ' + invitationStatus.Accept + ', updated_at: {updated_at}}',
        'RETURN rel, partner.id AS user_id'].join('\n');
};

const deleteInvitation = function () {
    return ['MATCH (user:User {id: {id}}), (partner:User {id: {user_id}}) ',
        'OPTIONAL MATCH (user)-[rel:IS_PARTNER]->(partner) ',
        'OPTIONAL MATCH (user)<-[rel1:IS_PARTNER]-(partner) ',
        'DELETE rel, rel1 RETURN true'].join('\n');
};

const sortPaginator = function (sort) {
    return 'ORDER BY ' + sort + ' SKIP {start} LIMIT {counter}';
};

const getPartners = function () {
    return ['MATCH (user:User {id: {user_id}})-[:IS_PARTNER {status: '
    + invitationStatus.Accept + '}]-(partner:User)-[]-(p)-[]->(art: Art), (me:User {id:{id}}) ',
        'MATCH (me)-[]-(me_profile)-[]->(me_art:Art) ',
        'OPTIONAL MATCH (partner)-[rel_partner:IS_PARTNER {status: ' + invitationStatus.Accept + '}]-(pop) ',
        'OPTIONAL MATCH (me_profile)-[rel_common_art:HAS_ART]-(art) ',
        'OPTIONAL MATCH (me)-[common_partner:IS_PARTNER {status: ' + invitationStatus.Accept + '}]-(pop) ',
        'RETURN partner, art.name AS art, COUNT(rel_partner) AS partners_count, COUNT (common_partner) AS common_partners_count, '+
        'COUNT(rel_common_art) AS common_arts_count'].join('\n');
};



module.exports = {
    //Users
    createUser: createUser,
    login: login,
    me: me,
    getUsers: getUsers,
    getUserById: getUserById,
    updateUser: updateUser,
    getUsersByEmail: getUsersByEmail,
    getUserByEmail: getUserByEmail,
    getUsersByName: findUsersByName,
    findUsers: findUsers,
    findUsersByArt: findUsersByArt,
    getPartners: getPartners,

    //invitations
    createInvitation: createInvitation,
    getInvitations: getInvitations,
    countInvitations: countInvitations,
    countInvitationsSent: countInvitationsSent,
    getInvitationsSent: getInvitationsSent,
    findInvitationById: findInvitationById,
    acceptInvitation: acceptInvitation,
    deleteInvitation: deleteInvitation,


    //Arts
    getArts: getArts,
    createArts: createArts,
    createUniqueConstraint: createUniqueConstraint
};



