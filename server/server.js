var app = require('express')();
var http = require('http').createServer(app);
// const { MongoClient } = require('mongodb');
//socket.io
var io = require('socket.io')(http);
//dotenv
require('dotenv').config();

//mongoose
const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/My-irc-tchat-app');
  console.log("db connecté");
}
var users = [];
var channels = ['#accueil'];


io.on('connection', (socket, messages) => {
    var me = '';

    /*
    * Login for the user
    */
    socket.on('login', (user) => {
        users.push(user.username);
        me = user.username;
        io.emit('listUsers', {
            user: users
        })

        io.emit('listChannels', {
            channels: channels
        })

        socket.broadcast.emit('newuser', {
            username: user.username
        })

    });

    /*
    * Logout for the user
    */
    socket.on('disconnect', (user) => {
        if(me != '') {
            socket.broadcast.emit('disuser', {
                username: me
            })
            users = users.filter(user => user !== me);
            io.emit('listUsers', {
                user: users
            })
        }
    })

    /*
    * Send message to everyone / rooms
    */
    socket.on('newmessage', function(message) {
        io.emit('newmsg', {
            messages: message
        })
    })

    /*
    * Change username / nickname
    */
    socket.on('rename', function(username) {
        me = username.rename;
        users = users.filter(user => user !== username.username);
        users.push(username.rename);
        io.emit('listUsers', {
            user: users
        });
        io.emit('renameuser', {
            username: username.username,
            rename: username.rename
        })
    })

    /*
    * Create a new channel / rooms
    */
    socket.on('newChannel', function(channel) {
        channels.push('#' + channel.channel);
        io.emit('listChannels', {
            channels: channels
        })
    })
});

http.listen(3001, function(){
    console.log('listening on *:3001');
});
