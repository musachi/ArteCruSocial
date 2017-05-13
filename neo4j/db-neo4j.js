/**
 * Created by Adonys on 3/14/2017.
 */

var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://127.0.0.1:7687', neo4j.auth.basic('neo4j', 'aa'));

exports.getSession = function getSession(context) {
    if (context.neo4jSession) {
        console.log("Exist session: " + context.neo4jSession);
        return context.neo4jSession;
    }
    else {
        context.neo4jSession = driver.session();
        console.log("Do not Exist session: " + JSON.stringify(context.neo4jSession));
        return context.neo4jSession;
    }
};
