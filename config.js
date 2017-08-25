'use strict';

const nconf = require('nconf');

nconf.env(['PORT', 'NODE_ENV'])
    .argv({
        'e': {
            alias: 'NODE_ENV',
            describe: 'Set production or development mode.',
            demand: false,
            default: 'development'
        },
        'p': {
            alias: 'PORT',
            describe: 'Port to run on.',
            demand: false,
            default: 3000
        },
        'n': {
            alias: "neo4j",
            describe: "Use local or remote neo4j instance",
            demand: false,
            default: "local"
        },
        'h':{
            alias: "HOST",
            describe: "Use local or remote neo4j instance",
            demand: false,
            default: "192.168.2.100"
        }
    })
    .defaults({
        'NEO4J_USERNAME': "neo4j",
        'NEO4J_PASSWORD' : "aa",
        'neo4j': 'local',
        'neo4j-local': 'bolt://localhost:7687',
        'neo4j-remote': 'bolt:http://162.243.2.100:7687',
        'base_url': 'http://localhost:3000',
        'api_path': '/api/v1.0',
        'PG_USERNAME': "postgres",
        'PG_PASSWORD': "aa",
        'pg-local': "http://localhost:5324",
        'ORIGIN_HOST': "http://192.168.2.102:3000"
    });

module.exports = nconf;