const { ConsoleLogger } = require('@angular/compiler-cli');
const app = require('express');
const { Socket } = require('socket.io-client');
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
    cors: true,
    origins: ["*"]
});

io.on("connection", (socket) => {
    Console.log("a user connected")

    socket.emit('message', 'Hey I just connected');

    socket.broadcast.emit('message', 'Hi this message send to everyone except sender');

    io.emit("This is send to everyone");

    socket.join("HERE IS A UNIQUE ID FOR THE ROOM");

    socket.to("UNIQUE ID").emit("message", "THIS MESAGGE WILL BE SIND TO EVERYONE ON THE ROOM EXCEPT THE SENDER");

    io.to("UNIQUE ID").emit("message", "THIS MESAGGE WILL BE SIND TO EVERYONE ON THE ROOM EXCEPT THE SENDER");
})

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => console.log('Server is runnning on port ' + PORT));