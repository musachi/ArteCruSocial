const invitationStatus = require('../models/Service/invitation-status').invitationStatus;
const util = require('util');

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
        '(literature:Art {name: "Literature"}), (dance:Art {name: "Dance"}), (cinema:Art {name: "Cinema"}, (other:Art {name: "Other"})';
};

/**
 * @returns {string}
 * @constructor
 */
const getArts = function () {
    return ['MATCH (user:User {id:{id}})-[:PROFESSIONAL_PROFILE]->(pro)-[rel:HAS_ART {main:true}]->(main_art:Art) ',
        'MATCH (pro)-[:HAS_ART]->(art:Art) WHERE NOT (main_art.name = art.name) ',
        'RETURN COLLECT(art.name) AS arts, main_art.name AS art'].join("\n");
};

const createUser = function () {
    return ['MATCH (art:Art {name: {art}}) ',
        'MERGE (user:User {id: {id}, email: {email}, password: {password}, name: {name}, created_at: {created_at}}) ',
        'MERGE (user)-[:PERSONAL_PROFILE]->(personal:PersonalProfile) ',
        'MERGE (user)-[:PROFESSIONAL_PROFILE]->(professional:ProfessionalProfile)-[know:HAS_ART {main: true}]->(art) ',
        'RETURN user, art.name AS art'].join('\n');
};

const updateUser = function () {
    return ['MATCH (user:User {id: {id}}) ',
        'SET user.name = {name}, user.email = {email} ',
        'RETURN user'].join('\n');
};

const updateUserAvatar = function () {
    return ['MATCH (user:User {id: {id}}) ',
        //'MERGE (image: Attachment {oid: {oid}}) ',
        //'ON CREATE SET (image.type = {type}), user-[:HAS_AVATAR]->(image) ',
        'SET user.avatar = {avatar} ',
        'RETURN user.avatar as avatar'].join('\n');
};

const getUserById = function () {
    return ['MATCH (user:User {id: {id}})-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'OPTIONAL MATCH (profile)-[rel_arts:HAS_ART]->(arts:Art) WHERE NOT (EXISTS(rel_arts.main)) ',
        'RETURN user, art.name AS art, COLLECT(arts.name) AS arts'].join('\n');
};

const getUserByEmail = function () {
    return ['MATCH (user:User {email: {email}})-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'OPTIONAL MATCH (profile)-[rel_arts:HAS_ART]->(arts:Art) WHERE NOT rel_arts.main = true ',
        'RETURN user, art.name AS art'].join('\n');
};


const getUsersByEmail = function () {
    return ['MATCH (user:User)-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'WHERE user.email CONTAINS lower(trim({email})) ',
        'OPTIONAL MATCH (profile)-[rel_arts:HAS_ART]->(arts:Art) WHERE NOT (EXISTS(rel_arts.main)) ',
        'RETURN user, art.name AS art, COLLECT(arts.name) AS arts ORDER BY user.name SKIP {offset} LIMIT {limit}'].join('\n');
};

const findUsersByName = function () {
    return ['MATCH (user:User)-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'WHERE lower(trim(user.name)) CONTAINS lower(trim({name})) ',
        'OPTIONAL MATCH (profile)-[rel_arts:HAS_ART]->(arts:Art) WHERE NOT (EXISTS(rel_arts.main)) ',
        'RETURN user, art.name AS art, COLLECT(arts.name) AS arts ORDER BY user.name SKIP {offset} LIMIT {limit}'].join('\n');
};

const findUsers = function () {
    return ['MATCH (me:User {id: {id}}) ',
        'MATCH (user: User)-[relation]->(profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'WHERE (lower(trim(user.name)) CONTAINS lower(trim({field})) OR user.email CONTAINS lower(trim({field}))) ' +
        'AND NOT user.id = me.id ',
        'OPTIONAL MATCH (profile)-[rel_arts:HAS_ART]->(arts:Art) WHERE NOT (EXISTS(rel_arts.main))',
        'OPTIONAL MATCH (me)-[partner_rel_sent: IS_PARTNER]->(user) ',
        'OPTIONAL MATCH (me)<-[partner_rel_received: IS_PARTNER]-(user) ',
        'RETURN DISTINCT user, partner_rel_sent, partner_rel_received, art.name AS art, COLLECT(arts.name) AS arts ' +
        'ORDER BY user.name SKIP {offset} LIMIT {limit}'].join('\n');
};

const findUsersByArt = function () {
    return ['MATCH (user:User)-[relation]->(profile) ',
        'MATCH (me:User {id: {id}})',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'WHERE lower(trim(user.name)) CONTAINS lower(trim({field})) OR user.email CONTAINS lower(trim({field}))',
        'MATCH (user)-[PROFESSIONAL_PROFILE]->(p)-[HAS_ART {main:true}]->(art:Art {name: {art}}) ',
        'OPTIONAL MATCH (profile)-[rel_arts:HAS_ART]->(arts:Art) WHERE NOT (EXISTS(rel_arts.main)) ',
        'OPTIONAL MATCH (me)-[partner_rel_sent: IS_PARTNER]->(user) ',
        'OPTIONAL MATCH (me)<-[partner_rel_received: IS_PARTNER]-(user) ',
        'RETURN DISTINCT user, partner_rel_sent, partner_rel_received, art.name AS art, COLLECT(arts.name) AS arts ' +
        'ORDER BY user.name SKIP {offset} LIMIT {limit}'].join('\n');
};

const getUsers = function () {
    return ['MATCH (user:User)-[relation]->(profile) ',
        'MATCH (profile)-[rel:HAS_ART {main: true}]->(art:Art) ',
        'OPTIONAL MATCH (profile)-[rel_arts:HAS_ART]->(arts:Art) WHERE NOT (EXISTS(rel_arts.main)) ',
        'RETURN user, art.name AS art, COLLECT(arts.name) AS arts ORDER BY user.name SKIP {offset} LIMIT {limit}'].join('\n');
};

const login = function () {
    return ['MATCH (user:User {email: {email}, password: {password}}) ',
        'MATCH (user)-[:PERSONAL_PROFILE]->(personal) ',
        'MATCH (user)-[:PROFESSIONAL_PROFILE]->(professional) ',
        'MATCH (professional)-[:HAS_ART {main: true}]->(art) ',
        'OPTIONAL MATCH (professional)-[rel_arts:HAS_ART]->(arts:Art) WHERE NOT (EXISTS(rel_arts.main)) ',
        'RETURN user, art.name AS art, COLLECT(arts.name) AS arts'].join('\n');
};

const me = function () {
    return ['MATCH (user:User {token}) ',
        'MATCH (user)-[:PERSONAL_PROFILE]->(personal) ',
        'MATCH (user)-[:PROFESSIONAL_PROFILE]->(professional) ',
        'MATCH (professional)-[:HAS_ART {main: true}]->(art) ',
        'RETURN user, art'
    ].join("\n");
};

const addArtsToUser = function () {
    return ['MATCH (user:User {id:{id}})-[:PROFESSIONAL_PROFILE]->(pro_profile)-[:HAS_ART {main: true}]->(main_art:Art)',
        'UNWIND {arts} AS art_name ',
        'MATCH (art:Art {name:art_name}) ',
        'MERGE (pro_profile)-[rel_art:HAS_ART]->(art) ',
        'RETURN user, main_art.name AS art, COLLECT(art.name) AS arts'].join("\n");
};

const deleteArtsFromUser = function () {
    return ['MATCH (user:User {id:{id}})-[:PROFESSIONAL_PROFILE]->(pro_profile)-[:HAS_ART {main: true}]->(main_art:Art)',
        'UNWIND {arts} AS art_name ',
        'MATCH (art:Art {name:art_name}) ',
        'MATCH (pro_profile)-[rel_art:HAS_ART]->(art) WHERE NOT (EXISTS(rel_art.main))',
        'DELETE rel_art RETURN true'].join("\n");
};

const getUserArts = function () {
    return ['MATCH (me:User {id:{id}})-[]->(pro_profile) ',
        'MATCH (pro_profile)-[:HAS_ART]->(art:Art) ',
        'RETURN me, art.name AS art'].join("\n");
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
        'ON MATCH SET rel += {status: {invitation_status}, updated_at: {updated_at}} ',
        'RETURN rel, partner.id AS user_id'].join('\n');
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

const getUserPartners = function () {
    return ['MATCH (me: User {id: {id}}) ',
        'MATCH (user: User {id: {user_id}})-[:IS_PARTNER {status: ' + invitationStatus.Accept + '}]-(user_partner)',
        'MATCH (user_partner)-[]-(pop_pro_profile)-[:HAS_ART]->(user_partner_arts) ',
        'MATCH (user_partner)-[]-(pop_pro_profile)-[:HAS_ART {main: true}]->(user_partner_art) ',
        'OPTIONAL MATCH (user_partner)-[:IS_PARTNER {status: ' + invitationStatus.Accept + '}]-(user_pop)',
        'OPTIONAL MATCH (me)-[]->(me_pro_profile)-[common_art:HAS_ART]->(user_partner_arts) ',
        'OPTIONAL MATCH (me)-[common_partners:IS_PARTNER {status: ' + invitationStatus.Accept + '}]-(user_pop) ',
        'OPTIONAL MATCH (me)-[r_sent:IS_PARTNER]->(user_partner) ',
        'OPTIONAL MATCH (me)<-[r_received:IS_PARTNER]-(user_partner) ',
        'RETURN DISTINCT user_partner AS user, user_partner_art.name AS art, COUNT(DISTINCT common_art) AS common_arts_count, ' +
        'COLLECT(DISTINCT user_partner_arts.name) AS arts, COUNT(DISTINCT user_pop) AS partners_count, ' +
        'COUNT(DISTINCT common_partners) AS common_partners_count, r_sent, r_received'].join('\n');
};

const partner = function () {
};

const getPartners = function () {
    return ['MATCH (me: User {id: {id}})-[:IS_PARTNER {status: ' +
    invitationStatus.Accept + '}]-(partner: User)-[]->(partner_pro_profile)-[:HAS_ART {main: true}]->(partner_art: Art) ',
        'MATCH (partner_pro_profile)-[rel_partner_arts:HAS_ART]->(partner_arts: Art) ',
        'OPTIONAL MATCH (partner)-[rel_pop:IS_PARTNER {status: ' + invitationStatus.Accept + '}]-(pop)',
        'OPTIONAL MATCH (me)-[]->(me_pro_profile)-[common_art:HAS_ART]->(partner_arts) ',
        'OPTIONAL MATCH (me)-[common_partners:IS_PARTNER {status: ' + invitationStatus.Accept + '}]-(pop) ',
        'RETURN partner AS user, partner_art.name AS art, COUNT(DISTINCT common_art) AS common_arts_count, ' +
        'COLLECT(DISTINCT partner_arts.name) AS arts, COUNT(DISTINCT pop) AS partners_count, ' +
        'COUNT(DISTINCT common_partners) AS common_partners_count'].join('\n');
};

const updatePersonalProfile = function () {
    return ['MATCH (user:User {id:{id}})-[:PERSONAL_PROFILE]->(personal) ',
        'SET user.name = {name}, personal.gender = {gender}, personal.birthday = {birthday}, personal.phone = {phone}, ' +
        'personal.website = {website} ',
        'RETURN personal AS personal_profile, user.name AS name'].join("\n");
};

const getPersonalProfile = function () {
    return ['MATCH (user:User {id:{id}})-[:PERSONAL_PROFILE]->(personal: PersonalProfile)',
        'RETURN personal, user.name AS name'].join("\n");
};

//posts
//TODO create post index with time and it has to be unique
const createPost = function (formattedDate, oid, uri, art, post_to_response_fromattedDate) {
    //return "CREATE (post: Post {time: {time}, text: {text}}) RETURN post";

    let cypherQuery = ['MATCH (user: User {id: {user_id}}) '];
    if (art) {
        cypherQuery[cypherQuery.length] = 'MATCH (art: Art {name: \'' + art + '\'}) ';
    }

    if (post_to_response_fromattedDate) {
        cypherQuery[cypherQuery.length] = 'MATCH (user_owner_post: User {id: {post_user_id}})' +
            '-[:POSTED_ON_' + post_to_response_fromattedDate +
            ']->(post_to_response: Post {time: {post_time}}) ';
    }

    cypherQuery[cypherQuery.length] = 'CREATE (post:Post {status: {status}, time: {time}, text: {text}}) ';
    if (oid || uri) {
        cypherQuery[cypherQuery.length] = 'CREATE (attachment: Attachment {oid: \'' + oid + '\', type: {type}, uri: \'' + uri + '\'}) ';
        cypherQuery[cypherQuery.length] = 'CREATE (post)-[post_image:POST_ATTACHMENT]->(attachment) ';
    }

    if (art)
        cypherQuery[cypherQuery.length] = 'CREATE (post)-[:BELONG_ART]->(art) ';
    cypherQuery[cypherQuery.length] = 'CREATE (user)-[posted: POSTED_ON_' + formattedDate + ']->(post) ';

    if (post_to_response_fromattedDate) {
        console.log("merge response: " + post_to_response_fromattedDate);
        cypherQuery[cypherQuery.length] = 'CREATE (post)-[:RESPONSE_TO]->(post_to_response) ';
    }

    //return
    let returnQuery = 'RETURN post';
    if (oid || uri)
        returnQuery += ', attachment';
    if (art)
        returnQuery += ', art.name AS art';

    cypherQuery[cypherQuery.length] = returnQuery;
    console.log("cypher query: " + util.inspect(cypherQuery));
    return cypherQuery.join("\n");
};

//TODO put limit by default in constants put limit and offset solo se pueden devolcer 3 posts tambien la cantidad de usuarios
const getPosts = function (formattedDate) {
    return ['MATCH (user:User {id: {id}})-[posted:POSTED_ON_' + formattedDate + ']->(post:Post) ' +
    'WHERE NOT (post)-[:RESPONSE_TO]->() AND post.time < {latest_time} AND post.time > {earliest_time} ',
        'OPTIONAL MATCH (post)-[:POST_ATTACHMENT]->(attachment) ',
        'OPTIONAL MATCH (post)-[:BELONG_ART]->(art) ',
        'OPTIONAL MATCH (post)<-[response_to:RESPONSE_TO]-(post_r: Post)<-[]-(user_r: User) ',
        'OPTIONAL MATCH (post)<-[:NICE]-(nice_users: User) ',
        'OPTIONAL MATCH (post)<-[rel:NICE]-(user) ',
        'RETURN DISTINCT post, COUNT(post) AS post_count, user, attachment, art.name AS art, COUNT(DISTINCT nice_users) AS nice_count, ' +
        'COUNT(post_r) AS responses_count, COLLECT(DISTINCT nice_users)[..5] AS nice_users, COUNT(DISTINCT rel) AS nice_for_me ' +
        sortPaginator('post.time', '0', '3', 'DESC ')].join("\n");
};

const getPostsTimeline = function (formattedDate) {
    return ['MATCH (user: User {id: {id}})-[posted:POSTED_ON_' + formattedDate + ']->(post:Post) ' +
    'WHERE NOT (post)-[:RESPONSE_TO]->() AND (post.time < {latest_time}) AND post.time > {earliest_time} ',
        'OPTIONAL MATCH (post)-[:POST_ATTACHMENT]->(attachment) ',
        'OPTIONAL MATCH (post)-[:BELONG_ART]->(art) ',
        'OPTIONAL MATCH (post)<-[:RESPONSE_TO]-(post_r: Post)<-[]-(user_r: User) ',
        'OPTIONAL MATCH (post)<-[:NICE]-(nice_users: User) ',
        'OPTIONAL MATCH (post)<-[rel:NICE]-(user) ',
        'RETURN DISTINCT post, user, attachment, art.name AS art, COUNT(DISTINCT nice_users) AS nice_count, ' +
        'COUNT(DISTINCT rel) AS nice_for_me, ' +
        'COUNT(post_r) AS responses_count, COLLECT(DISTINCT nice_users)[..5] AS nice_users ' +
        sortPaginator('post.time', '0', '3', 'DESC '),
        'UNION ',
        'MATCH (user:User {id: {id}})-[:IS_PARTNER {status: ' + invitationStatus.Accept +
        '}]-(friend: User)-[posted:POSTED_ON_' + formattedDate + ']->(post:Post) ' +
        'WHERE NOT (post)-[:RESPONSE_TO]->() AND (post.time < {latest_time}) AND post.time > {earliest_time} ' +
        'AND NOT (user)-[:BLOCK]-(friend) ',
        'OPTIONAL MATCH (post)-[:POST_ATTACHMENT]->(attachment) ',
        'OPTIONAL MATCH (post)-[:BELONG_ART]->(art) ',
        'OPTIONAL MATCH (post)<-[:RESPONSE_TO]-(post_r: Post)<-[]-(user_r: User) ',
        'OPTIONAL MATCH (post)<-[:NICE]-(nice_users: User) ',
        'OPTIONAL MATCH (post)<-[rel:NICE]-(user) ',
        'RETURN DISTINCT post, friend AS user, attachment, art.name AS art, COUNT(DISTINCT nice_users) AS nice_count, ' +
        'COUNT(DISTINCT rel) AS nice_for_me, ' +
        'COUNT(post_r) AS responses_count, COLLECT(DISTINCT nice_users)[..5] AS nice_users ' +
        sortPaginator('post.time', '0', '3', 'DESC ')
    ].join("\n");
};

const findPost = function (formattedDate) {
    return ['MATCH (user:User {id: {post_user_id}})-[posted:POSTED_ON_' + formattedDate + ']->(post:Post {time: {post_time}}) ',
        'OPTIONAL MATCH (post)-[:POST_ATTACHMENT]->(attachment) ',
        'OPTIONAL MATCH (post)-[:BELONG_ART]->(art) ',
        'OPTIONAL MATCH (post)<-[:RESPONSE_TO]-(post_r: Post)<-[]-(user_r: User) ',
        'OPTIONAL MATCH (post)<-[:NICE]-(nice_users: User) ',
        'RETURN DISTINCT post, user, attachment, art.name AS art, COUNT(nice_users) AS nice_count, ' +
        'COUNT(post_r) AS responses_count, COLLECT(DISTINCT nice_users)[..5] AS nice_users ' +
        sortPaginator('post.time', '0', '3', 'DESC ')].join("\n");
};

//TODO restringir la cantidad de caracteres
const getPostResponses = function (formattedDate) {
    return ['MATCH (post_user: User {id: {post_user_id}})-[:POSTED_ON_' + formattedDate + ']->(post_main: Post {time: {post_time}}) ',
        'MATCH (post_main)<-[:RESPONSE_TO]-(post)<-[]-(user: User) ',
        'OPTIONAL MATCH (post)-[:POST_ATTACHMENT]->(attachment) ',
        'OPTIONAL MATCH (post)-[:BELONG_ART]->(art) ',
        'OPTIONAL MATCH (post)<-[:NICE]-(nice_users: User) ',
        'RETURN DISTINCT post, attachment, user, art.name AS art, COUNT(nice_users) AS nice_count, ' +
        'COUNT(post) AS responses_count, COLLECT(DISTINCT nice_users)[..4] AS nice_users '
        + sortPaginator("post.time", null, null, "DESC ")].join("\n");
};

const getPostNiceUsers = function (formattedDate) {
    return ['MATCH (post_user: User {id: {post_user_id}})-[:POSTED_ON_' + formattedDate + ']->(post: Post {time: {post_time}}) ',
        'OPTIONAL MATCH (post)<-[rel_nice: NICE]-(user:User) ',
        'RETURN DISTINCT user ' + sortPaginator('user.name', '{offset}', '{limit}', "DESC")].join("\n");
};

const getPost = function (dateFormatted) {
    //return ['MATCH (user_post_owner: User {id:user_id})-[:POSTED_ON_' + dateFormatted + ']->(post: Post{time: {time}}) ',

};

const userNicePost = function (dateFormatted) {
    return ['MATCH (user_post_owner: User {id: {user_id}})-[:POSTED_ON_' + dateFormatted + ']->(post: Post{time: {post_time}}) ',
        'MATCH (user:User {id: {id}})-[rel: NICE]->(post) ',
        'RETURN rel'].join("\n");
};

const createNice = function (dateFormatted) {
    return ['MATCH (user_post_owner: User {id: {user_id}})-[:POSTED_ON_' + dateFormatted + ']->(post: Post{time: {post_time}}) ',
        'MATCH (user:User {id: {id}}) ',
        'CREATE (user)-[:NICE {time: {time}}]->(post) ',
        'WITH (post) ',
        'OPTIONAL MATCH (post)<-[:NICE]-(nice_users) ',
        'RETURN post, COUNT(nice_users) AS nice_count, COLLECT(DISTINCT nice_users)[..5] AS nice_users'].join("\n");
};

const removeNice = function (dateFormatted) {
    return ['MATCH (user_post_owner: User {id: {user_id}})-[:POSTED_ON_' + dateFormatted + ']->(post: Post{time: {post_time}}) ',
        'MATCH (user:User {id: {id}})-[rel:NICE]->(post) DELETE rel RETURN true'].join("\n");
};

const blockUser = function () {
    return ['MATCH (user: User {id: {id}}), (user_to_block: User {id: {user_id}}) ',
        'MERGE (user)-[:BLOCK]->(user_to_block) ',
        'RETURN true '].join('\n');
};

const unblockUser = function () {
    return ['MATCH (user: User {id: {id}}), (user_to_block: User {id: {user_id}}) ',
        'MATCH (user)-[r:BLOCK]->(user_to_block) ',
        'DELETE r'].join('\n');
};

//Messages for group and users  TODO indexar group id
const sendMessage = function () {
    return ['MATCH (owner_user: User {id: {owner_user_id}}),  '].join("\n");
};

const sortPaginator = function (sort, offset, limit, order) {
    let paginator = 'ORDER BY ' + sort;
    if (order)
        paginator += ' ' + order;
    if (offset && limit)
        return paginator += ' SKIP ' + offset + ' LIMIT ' + limit;

    return paginator + ' SKIP {offset} LIMIT {limit}';
};

module.exports = {
    //Arts
    getArts: getArts,
    createArts: createArts,
    createUniqueConstraint: createUniqueConstraint,

    //Users
    createUser: createUser,
    login: login,
    me: me,
    getUsers: getUsers,
    updateUser: updateUser,
    updateUserAvatar: updateUserAvatar,
    getUserById: getUserById,
    getUserByEmail: getUserByEmail,
    findUsers: findUsers,
    getUsersByEmail: getUsersByEmail,
    getUsersByName: findUsersByName,

    //partners
    getPartners: getPartners,
    getUserPartners: getUserPartners,

    //blocks
    blockUser: blockUser,
    unblockUser: unblockUser,

    //User arts
    addArtsToUser: addArtsToUser,
    findUsersByArt: findUsersByArt,
    deleteArtsFromUser: deleteArtsFromUser,

    //profiles
    getPersonalProfile: getPersonalProfile,
    updatePersonalProfile: updatePersonalProfile,

    //invitations.js
    createInvitation: createInvitation,
    getInvitations: getInvitations,
    countInvitations: countInvitations,
    countInvitationsSent: countInvitationsSent,
    getInvitationsSent: getInvitationsSent,
    findInvitationById: findInvitationById,
    acceptInvitation: acceptInvitation,
    deleteInvitation: deleteInvitation,

    //posts
    createPost: createPost,
    getPosts: getPosts,
    getPostsTimeline: getPostsTimeline,
    getPostResponses: getPostResponses,
    getPostNiceUsers: getPostNiceUsers,
    findPost: findPost,
    createNice: createNice,
    removeNice: removeNice,
    userNicePost: userNicePost
};

