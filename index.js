const fs = require('fs')

const blockedIPSFile = './blocked.json'

const express = require('express');
const app = express();

const session = require('express-session')

const http = require('http').Server(app);
const io = require('socket.io')(http);

let blockedIPS = []

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


try {
    if(fs.existsSync(blockedIPSFile)) {
        fs.readFile(blockedIPSFile, (err, data) => {
            if (err) throw err;
            blockedIPS = JSON.parse(data)
            console.log(blockedIPS)
        })
    }
} catch(err) {
    console.error(err)
}


app.get('/', function(req, res) {
    var request_ip = req.ip 
            || req.connection.remoteAddress 
            || req.socket.remoteAddress 
            || req.connection.socket.remoteAddress;

    if (blockedIPS.includes(request_ip)) {
        console.log("🚫 Blocked IP", request_ip, " attempted to connect!")
        setTimeout(function() {
            res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        }, 5000);
    } else {
        console.log(req.ip);
        res.render('index.ejs');
    }

});


// Allow the client to access certain files
app.use('/scripts', express.static(__dirname + '/node_modules/dompurify/dist/'));
app.use('/media', express.static(__dirname + '/media'));


io.on('connection', function(socket) {
    const session = socket.request.session;

    console.log(session.username)
    console.log(typeof(session.username))
    if (typeof(session.username) !== "string") {
        socket.emit('first_join')
    } else {
        socket.emit('join', session.username)
    }

    // When a client joins
    socket.on('join', function(username) {
        session.username = username;
        socket.username = username;
        io.emit('user_connected', socket.username);
        console.log('🔵 ' + socket.username + ' joined the chat ')
        session.save();
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
        session.username = username;
        socket.username = username;

        session.save();
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
            case "session":
                socket.emit('trusted_command_feedback', session)
                break;
            default:
                socket.emit('command_feedback', command + " isn't a command!");
        }
    })

    // When a client sends a message 
    socket.on('chat_message', function(message) {
        io.emit('chat_message', session.username, message);
        console.log(socket.username + ' : ' + message)
    });
    

});

const server = http.listen(8080, function() {
    console.log('YEET')
})