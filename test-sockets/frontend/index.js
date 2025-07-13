const socket = io('http://localhost:5001');

socket.on('connect', (data) => {
    console.log(data);
})

socket.on('hello', (data) => {
    console.log(data);
})

socket.emit('hello', 'Hello world there!')