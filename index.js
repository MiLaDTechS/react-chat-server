// Imports
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv/config");

const authRouter = require('./routers/authRouter');
const socketAuthenticate = require('./middlewares/socketAuthenticate');

// Initialize the server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [process.env.CLIENT_DEVELOPMENT_URL, process.env.CLIENT_PRODUCTION_URL],
        methods: ["GET", "POST"]
    }
});

// constants
const PORT = process.env.PORT || 3001;
let users = [];
let messages = {
    general: [],
    random: [],
    jokes: [],
    javascript: [],
    privateMessages: []
}

//DB Connection
mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("Connected to DB");
}).catch(error => {
    console.log('Error: ', error.message);
});

app.use(cors(), express.json());

app.use('/api', authRouter);

io.use(socketAuthenticate);

io.on('connection', socket => {
    socket.on('join server', ({ nickname, isLogin }, cb) => {
        !isLogin && socket.join('general');

        const user = {
            socketId: socket.id,
            userId: socket.userId,
            nickname
        }

        if (cb) {
            const userIndex = users.findIndex(u => u.nickname === user.nickname);

            if (userIndex > -1) {
                cb({ userExist: true, prevMessages: messages, message: `Username "${nickname}" is taken` });
            } else {
                users.push(user);
                cb({ userExist: false, users, user, prevMessages: messages });
            }

        } else {
            const userIndex = users.findIndex(u => u.nickname === user.nickname);
            userIndex === -1 && users.push(user);
        }

        io.emit('new user', users);
    });

    socket.on('join room', (roomName, cb) => {
        socket.join(roomName);
        cb(messages[roomName]);
    });

    socket.on('send message', ({ content, to, sender, chatName, isChannel }) => {
        for (const room in messages) {
            if (Object.hasOwnProperty.call(messages, room)) {
                if (room !== 'privateMessages') {
                    const roomMessages = messages[room];
                    if (roomMessages.length >= 50) {
                        roomMessages.splice(0, 1);
                    }
                }
            }
        }

        const payload = {
            content,
            chatName,
            sender,
            isChannel
        }

        socket.to(to).emit('new message', payload);

        if (isChannel) {
            messages[chatName].push({ sender, content })
        } else {
            const pvIndex = messages.privateMessages.findIndex(pv => {
                return [sender, chatName].every(i => pv.between.includes(i));
            });

            if (pvIndex > -1) {
                messages.privateMessages[pvIndex].messages.push({ sender, content })
            } else {
                messages.privateMessages.push({ between: [sender, chatName], messages: [{ sender, content }] })
            }
        }
    });

    socket.on('disconnect', () => {
        users = users.filter(u => u.socketId !== socket.id);
        io.emit('new user', users)
    })
})

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

