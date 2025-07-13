const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('Socket connected');

    socket.emit('hello', 'world!');

    socket.on('hello', (data) => {
        console.log(data);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
});

httpServer.listen(5001, () => console.log('Server is running at: 5001'));
