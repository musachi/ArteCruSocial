/**
 * Created by Adonys on 1/15/2017.
 */

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const nconf = require('./config');
const dbConnectionsCleanup = require('./middlewares/dbConnectionsCleanup');
const router = require('./routes');
const InitDB = require('./neo4j/init_db');
const AuthUser = require('./middlewares/authUser');
const methodOverride = require('method-override');
const swaggerJSDoc = require('swagger-jsdoc');
const util = require('util');

let expressWs = require('express-ws');
expressWs = expressWs(express());
const app = expressWs.app;
const api = express();

const swaggerDefinition = {
    info: {
        title: 'Artecru API',
        version: '1.0',
        description: 'Amigos del arte es una red social para todos.',
    },
    host: 'localhost:' + nconf.get('PORT'),
    basePath: '/',
};

const options = {
    swaggerDefinition: swaggerDefinition, // swagger definition
    apis: ['./routes/*.js'], // path where API specification are written
};

const swaggerSpec = swaggerJSDoc(options);

app.get(nconf.get('api_path') + '/swagger.json', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/docs', express.static(path.join(__dirname, 'swagger-doc')));

//setting server
app.set('port', nconf.get('PORT'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(dbConnectionsCleanup.dbNeo4jSessionCleanup);
app.use(dbConnectionsCleanup.dbPostgresClientCleanup);
api.use(bodyParser.json());
api.use(methodOverride());

//enable CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

const users = express.Router();
const invitations = express.Router();
const profiles = express.Router();
const uploads = express.Router();
const files = express.Router();
const posts = express.Router();
const messages = express.Router();


app.post('/authenticate', router.user.authenticate);
app.post(nconf.get('api_path') + '/authenticate', router.user.authenticate);

app.use(AuthUser);

//TODO delete user
users.route('/users')
    .post(router.user.createUser)
    .get(router.user.getUsers);
users.route('/users/:id')
    .get(router.user.findUserById)
    .put(router.user.updateUser);

users.route('/users/:id/arts')
    .get(router.user.getArts)
    .put(router.user.addArtsToUser)
    .delete(router.user.deleteArtsFromUser);

users.route('/users/:id/partners').get(router.user.getPartners);

profiles.route('/users/:id/profile/personal')
    .get(router.personal_profile.getPersonalProfile);

users.route('/users/find-by-email/:email').get(router.user.findUsersByEmail);
users.route('/users/find-by-name/:name').get(router.user.findUsersByName);
users.route('/users/find/:field').get(router.user.findUsers);

//TODO get block users
users.route('/users/blocks')
    .post(router.blocks.blockUser)
    //.get(router.user.getBlockedUsers)
    .delete(router.blocks.unblockUser);

invitations.route('/invitations/count').get(router.invitations.countInvitations);
invitations.route('/invitations')
    .get(router.invitations.getInvitations)
    .post(router.invitations.sendInvitation);
invitations.route('/invitations/:user_id')
    .get(router.invitations.findInvitationById)
    .put(router.invitations.acceptInvitation)
    .delete(router.invitations.deleteInvitation);

profiles.route('/profile/personal')
    .get(router.personal_profile.getPersonalProfile)
    .put(router.personal_profile.updatePersonalProfile);

uploads.route('/upload-avatar').post(router.uploads.uploadAvatar);
uploads.route('/upload').post(router.uploads.uploadImages);

files.route('/avatar').get(router.files.getAvatar);
files.route('/download').get(router.files.getAvatar);

posts.route('/posts')
    .post(router.posts.createPost)
    .get(router.posts.getPosts);

posts.route('/posts/responses')
    .get(router.posts.getPostResponses)
    .post(router.posts.responsePost);
posts.route('/posts/:time').get(router.posts.findPost);

posts.route('/posts/nice')
    .post(router.posts.createNice)
    .get(router.posts.getPostNiceUsers)
    .delete(router.posts.removeNice);

messages.route('/messages')
    .post(router.messages.sendMessage)
    .get(router.messages.getLastMessages);

//posts.route('/posts/art').get(router.posts.getPostsByArt);

//Validate if session is connected in all router
//TODO arts for a file
app.use(nconf.get('api_path'), users);
app.use('/', users);
app.use(nconf.get('api_path'), invitations);
app.use('/', invitations);
app.use(nconf.get('api_path'), profiles);
app.use('/', profiles);
app.use(nconf.get('api_path'), uploads);
app.use('/', uploads);
app.use(nconf.get('api_path'), files);
app.use('/', files);
app.use(nconf.get('api_path'), posts);
app.use('/', posts);
app.use(nconf.get('api_path'), messages);
app.use('/', messages);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/jquery.js', function (req, res) {
    res.sendFile(__dirname + '/public/jquery.js');
});

//TODO fine not like here is a shit, put in other file like all the other end points
const jwt = require('jsonwebtoken');
app.get('/message-token', function (req, res, next) {
    const response = jwt.sign({
        data: req.user['id']
    }, 'martesinnigth', {expiresIn: '30min'});
    res.send(200, {message_token: response});
});

let users_ws_connections = {};
let conversations = {};
const UserWsConnection = require('./models/Message/user-ws-connection');

app.ws('/connection/:user_id', function connection(ws, req) {

    if (req.token_error) {
        console.log("message token error");
        ws.send('error', "message token error");
        ws.close();
        return;
    }
    const token_id = req.user_id['data'];
    const user_id = req.params.user_id;

    if (token_id != user_id) {
        console.log("error 400 user not match");
        ws.send(400, "invalid token");
    } else {
        users_ws_connections[user_id] = new UserWsConnection(ws);

        ws.on('message', function (msg) {
            console.log("received message:", msg.data);
            msg.type = "private";
            msg.target_id = "d11d4385-b799-41a8-bc30-d7e3b327bd21";
            if (msg.type == "private") {
                if (users_ws_connections[msg.target_id])
                    users_ws_connections[msg.target_id]['ws'].send(msg);
            }
            else if (conversations[msg.target_id])
                conversations[msg.target_id].connections.forEach(function (target_user_id) {
                    if (users_ws_connections[target_user_id]['ws'] === ws) return;
                    users_ws_connections[target_user_id]['ws'].send(msg);
                });
        });

        ws.on('close', function onClose() {
            const user_conversations = users_ws_connections[user_id]['conversations'];
            for (let i = 0; i < user_conversations.length(); i++) {
                delete conversations[user_conversations[i]].connections[user_id];
            }
            delete users_ws_connections[user_id];
            console.log("closed web socket");
        });

        ws.on('users_online', function(){
            //users.
        });

        setTimeout(function(){
            ws.disconnect();
            delete users_ws_connections[user_id];
        }, 30*60*1000);
    }
});

app.post('/users/:id/conversations/join/:target_id', function (req, res, next) {
    const user_id = req.params.id;
    const user_ws = conversations[user_id];
    if (user_ws) {
        const target_id = req.params.target_id;
        ws_connection(user_ws, user_id, target_id);
        res.send(200, "added to group ok");
    }
});

function ws_connection(user_id, target_id) {
    let target = conversations[target_id] || {
            connections: []
        };
    target.connections.push(user_id);
    users_ws_connections[user_id][conversations].push(target);
}

/*const io = require('socket.io')(server);
 let us = new Array();
 io.on('connection', function (socket) {
 console.log("alguien se ha conectado");

 socket.on('login', function (msg) {
 console.log('Received Login in server: %s', msg);
 socket.emit('login', {"user": "System", "text": "Welcome to the chat"});
 us.push(msg);
 });

 socket.emit('message', '<p class="message">Welcome from server!</p>');
 socket.on('message', function (msg) {
 var text = msg.message;
 io.sockets.emit('message', {"user": msg.user, "text": text});
 });

 socket.on('list', function (msg) {
 console.log('Received list: %s', msg);
 socket.emit('list', us);
 });
 });*/


app.listen(3000, function (err) {
    if (err) {
        console.log(util.inspect(err));
        app.listen(3010);
        console.log("Server started on port 3010");
    }
    console.log("Server started on port 3000");
});


module.exports = app;

