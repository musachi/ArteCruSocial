const pgp = require('pg-promise')();

const config = {
    user: 'postgres',       //env var: PGUSER
    database: 'artecru',   //env var: PGDATABASE
    password: 'aa',         //env var: PGPASSWORD
    host: 'localhost',      // Server hosting the postgres database
    port: 5432,             //env var: PGPORT
    max: 20,                // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

function generateConnectionString() {
    return "postgres://" + config.user + ":" + config.password + "@" + config.host + ":" + config.port + "/" + config.database;
}

const pgpClient = pgp(generateConnectionString());

exports.getPgpClient = function (context) {
    if (context.pgpClient)
        return context.pgpClient;

    context.pgpClient = pgpClient;
    return context.pgpClient;
};

exports.connectionString = function () {
    return generateConnectionString();
};


