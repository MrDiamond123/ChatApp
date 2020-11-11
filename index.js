const express = require('express');
const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

const command_help = 'Server Commands: \
<br> help | Shows you the list of commands! \
<br> nick | Allows you to change your nickname \
<br> list | Shows you the list of everyone currently in the chat!'

app.get('/', function(req, res) {
    console.log(req.ip);
    res.render('index.ejs');
});


io.sockets.on('connection', function(socket) {
    socket.on('join', function(username) {
        socket.username = username;
        io.emit('is_online', '🔵 <i>' + socket.username + ' joined the chat..</i>');
        console.log('🔵 ' + socket.username + ' joined the chat ')
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>');
        console.log('🔴 ' + socket.username + ' left the chat')
    })
    socket.on('nickname', function(username) {
        io.emit('is_online', '<i>' + socket.username + ' has changed their name to ' + username +  '</i>');
        console.log(socket.username + ' has changed their name to ' + username)
        socket.username = username;
    })
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
    socket.on('chat_message', function(message) {
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
        console.log(socket.username + ' : ' + message)
    });

});

const server = http.listen(8080, function() {
    console.log('YEET')
})