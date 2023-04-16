const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const botName = "ChatApp!";
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on("connection", (socket) => {

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // to the single client which connects io.
        socket.emit('message', formatMessage(botName, "Welcome to ChatApp!"));

        // Broadcasts when a user connects, to all other users
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${username} has joined the chat`));

        socket.on("disconnect", () => {
            const user = userLeave(socket.id);
            if (user) {
                io.to(user.room)
                    .emit('message', formatMessage(botName, `${user.username} has left the chat`));  // here we can also use ${user.username} 
            }

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        });

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    // ...
    console.log("new WS connection...");


    //Listen for chat messages
    socket.on("chatMessage", msg => {
        const currentUser = getCurrentUser(socket.id);
        io.to(currentUser.room).emit('message', formatMessage(currentUser.username, msg));
    });
});

//app.post("/chat",(req))

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});