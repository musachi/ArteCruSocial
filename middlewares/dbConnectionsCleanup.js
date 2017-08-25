const dbNeo4jSessionCleanup = function (req, res, next) {
    res.on('finish', function () {
        if (req.neo4jSession) {
            req.neo4jSession.close();
            delete req.neo4jSession;
        }
    });
    next();
};

const dbPostgresClientCleanup = function (req, res, next) {
    res.on('finish', function () {
        if (req.pgpClient) {
            //req.pgpClient;
            delete req.pgpClient;
        }
    });
    next();
};

module.exports = {
    dbNeo4jSessionCleanup: dbNeo4jSessionCleanup,
    dbPostgresClientCleanup: dbPostgresClientCleanup
};

