/**
 * Created by Adonys on 3/14/2017.
 */

const neo4j = require('neo4j-driver').v1;
const driver = neo4j.driver('bolt://127.0.0.1:7687', neo4j.auth.basic('neo4j', 'aa'));

exports.getSession = function getSession(context) {
    if (context.neo4jSession) {
        return context.neo4jSession;
    }
    else {
        context.neo4jSession = driver.session();
        return context.neo4jSession;
    }
};
