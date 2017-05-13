/**
 * Created by Adonys on 1/15/2017.
 */

var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var nconf = require('./config');
var app = express();

var neo4jSessionCleanup = require('./middlewares/dbneo4jSessionCleanup');
var router = require('./routes');
var InitDB = require('./neo4j/init_db');

var AuthUser = require('./middlewares/authUser');

//setting server
app.set('port', nconf.get('PORT'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(neo4jSessionCleanup);
//api.use(methodOverride());

//enable CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

var users = express.Router();
var invitations = express.Router();
//var groups = express.Router();

app.use(AuthUser);
app.post('/authenticate', router.user.authenticate);

//TODO delete user
users.route('/users')
    .post(router.user.createUser)
    .get(router.user.getUsers);
users.route('/users/:id')
    .get(router.user.findUserById)
    .put(router.user.updateUser);
users.route('/users/:id/partners').get(router.user.getPartners);
users.route('/users/find-by-email/:email').get(router.user.findUsersByEmail);
users.route('/users/find-by-name/:name').get(router.user.findUsersByName);
users.route('/users/find/:field').get(router.user.findUsers);

/*users.route('/arts')
    .post(router.arts.addArt)
    .get(router.arts.getArts);*/

invitations.route('/invitations/count').get(router.invitations.countInvitations);
invitations.route('/invitations')
    .get(router.invitations.getInvitations)
    .post(router.invitations.sendInvitation);
invitations.route('/invitations/:user_id')
    .get(router.invitations.findInvitationById)
    .put(router.invitations.acceptInvitation)
    .delete(router.invitations.deleteInvitation);

//invitations.route('/invitations/sent/count').get(router.invitations.countInvitationsSent);

app.use(nconf.get('api_path'), users);
app.use('/', users);
app.use(nconf.get('api_path'), invitations);
app.use('/', invitations);

//start server
app.listen(3000);
console.log("Server started on port 3000");

module.exports = app;

