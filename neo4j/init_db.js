const dbNeo4j = require('./db-neo4j');
const cypher = require('./cypher');
const _ = require('lodash');

const InitDB = module.exports = function () {
    let session = dbNeo4j.getSession(this);

    CreateConstraint(session);
    CreateArts(session);
};

const CreateConstraint = function (session) {
    const constrints = cypher.createUniqueConstraint();

    constrints.forEach(function (c) {
        session.run(c, {}).then(function () {
            console.log("Constraint Created");
        }).catch(function (err) {
            console.log("Error creating Constraint: " + err);
        });
    });
};

const CreateArts = function (session) {
    session.run('MATCH (art:Art) RETURN art').then(function (results) {
        if (_.isEmpty(results.records)) {
            dbNeo4j.getSession(this).run(cypher.createArts(), {}).then(function (r) {
                console.log("Arts Created");
                CloseSession(session);
            }).catch(function (err) {
                console.log("Error creating Arts: " + err);
                CloseSession(session);
            });
        }
    }).catch(function (err) {
        console.log("Error getting Arts: " + err);
        CloseSession(session);
    });
};

const CloseSession = function (session) {
    if (!session.isUndefined) {
        session.close();
        delete(session);
    }
};