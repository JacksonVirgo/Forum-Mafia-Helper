const express = require('express');
const app = express();
const server = require('http').Server(app);

const Tools = require('./_backend/util/toolReference');
const Stats = require('./_backend/statistics/userHandling');

// Routing
app.use(require('./_backend/routes/routes'));

// Setting port and running server.
const PORT = process.env.PORT || 2000;
server.listen(PORT);
console.log(`Server Initialized. Port ${PORT}`);``

// Start SOCKET.IO
const io = require(`socket.io`)(server, {cors:{origin:'*'}});
io.sockets.on('connection', (socket) => {
    Stats.addUser();
    console.log(`User connected with ID ${socket.id}`);

    Tools.VoteCount.getVotesFromThread("https://forum.mafiascum.net/viewtopic.php?f=2&t=85556&sid=9df5853d846c64b09f80d8651645ba68", socket);
   
    // Functions
    socket.on('parse-card', (data) => parseCard(data, socket));
    socket.on("console", (data) => console.log(data));
    socket.on('rand', (data) => randGame(data, socket));
    socket.on('scrapeReplacement', (data) => scrapeReplacement(data, socket));
    socket.on('scrapeVotecount', (data) => scrapeVotecount(data, socket));
    
    // On Disconnect
    socket.on("disconnect", () => {
        Stats.removeUser();
        console.log(`User disconnected with ID ${socket.id}`);
    });
});

function parseCard({ block, globals, list }, socket) {
    let processed = [];
    for (const value of list) {
        processed.push(Tools.RoleCard.lexer.parse({block, globals, value}));
    }
    socket.emit('parse-card', {list: processed});
}

function scrapeReplacement({ url }, socket) {
    Tools.Replacement.getReplacement(url, socket);
}

function scrapeVotecount({ url }, socket) {
    Tools.VoteCount.getVotesFromThread(url, socket);
}

function randGame({ list, players }, socket) {
    let randedArray = Tools.Rand.rand(players, list);
    socket.emit('rand', { rand: randedArray });
}