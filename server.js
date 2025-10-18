const express = require('express');
const http = require('http');
const socketlo = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketlo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});
const players = new Map();

io.on('connection',(socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('join',(data) => {
        players.set(socket.id, {
            id:socket.id,
            name: data.name || `Player_${socket.id.substring(0,6)}`,
        });
        socket.emit('players_update', Array.from(players.values()));

        socket.broadcast.emit('player_joined', {
            name: players.get(socket.id).name
        });
        io.emit('players_update', Array.from(players.values()));

        console.log(`${players.get(socket.id).name} Joined the game`);
    });

    socket.on ('message', (data) => {
        const messageData = {
            ...data,
            sender: socket.id,
            senderName: players.get(socket.id)?.name || 'Unknown'
        };

        io.emit('message', messageData);
        console.log(`Message from ${messageData.senderName}: ${data.text}`);
    });

    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log(`${player.name} disconnected`);
            socket.broadcast.emit('player_left', {
                name: player.name
            });

            players.delete(socket.id);

            io.emit('players_update', Array.from(players.values()));
        }
    });
    socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

server.listen(PORT, () => {
    console.log(`Morse Signal Game Server Running on port ${PORT}`);
    console.group(`Open http://127.0.0.1:${PORT} To Play`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received , shutting down');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});