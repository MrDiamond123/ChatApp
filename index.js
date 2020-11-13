const express = require('express');
const app = express();

const session = require('express-session')

const http = require('http').Server(app);
const io = require('socket.io')(http);

//TODO: Actually add sessions
const sessionMiddleware = session({ secret: 'cactus potato', cookie: { maxAge: 60000}})

app.use(sessionMiddleware)

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
})

const command_help = 'Server Commands: \
<br> help | Shows you the list of commands! \
<br> nick | Allows you to change your nickname \
<br> list | Shows you the list of everyone currently in the chat!'

app.get('/', function(req, res) {
    console.log(req.ip);
    res.render('index.ejs');
});


// Allow the client to access certain files
app.use('/scripts', express.static(__dirname + '/node_modules/dompurify/dist/'));
app.use('/media', express.static(__dirname + '/media'));


io.sockets.on('connection', function(socket) {
    // When a client joins
    socket.on('join', function(username) {
        socket.username = username;
        io.emit('user_connected', socket.username);
        console.log('🔵 ' + socket.username + ' joined the chat ')
    });

    //When a client leaves
    socket.on('disconnect', function(username) {
        io.emit('user_disconnected', socket.username);
        console.log('🔴 ' + socket.username + ' left the chat')
    })

    //When a client changes their nickname
    socket.on('nickname', function(username) {
        io.emit('user_changed_nickname', socket.username, username);
        console.log(socket.username + ' has changed their name to ' + username)
        socket.username = username;
    })

    //When a client runs a command
    //TODO: Make an actually good system for handling commands so I don't have to hardcode the help menu
    socket.on('command', function(command) {
        switch(command) {
            case "help":
                socket.emit('command_feedback', command_help);
                break;
            case "list":
                var list = "Connected People!: <br><i>"
                var clients = io.sockets.sockets;
                clients.forEach(e => {
                    list = list + e.username + "<br>"
                });
                list = list + "</i>"
                socket.emit('command_feedback', list);
                break;
            default:
                socket.emit('command_feedback', command + " isn't a command!");
        }
    })

    // When a client sends a message 
    socket.on('chat_message', function(message) {
        io.emit('chat_message', socket.username, message);
        console.log(socket.username + ' : ' + message)
    });
    

});

const server = http.listen(8080, function() {
    console.log('YEET')
})