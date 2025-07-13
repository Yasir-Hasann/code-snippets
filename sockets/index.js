const { Server, Socket } = require('socket.io');
const { Server: HttpServer } = require('http');
const { instrument } = require('@socket.io/admin-ui');
const Models = require('../server/models/model');

class SocketManager {
  static instance = null;
  io = null;
  socket = null;

  init(server) {
    let users = [];
    this.io = new Server(server, {
      cors: {
        origin: ['*'],
        credentials: true,
      },
    });
    instrument(this.io, {
      auth: false,
    });
    console.log('******* Socket Server Created ******');

    this.io.on('connection', async (socket) => {
      console.log('******* Socket Connection Init ******');
      const userId = socket.handshake.query.userId;

      if (socket.handshake.query.role === 'laundry-man') {
        await Models.LaundryMan.findByIdAndUpdate(
          { _id: socket.handshake.query.id },
          {
            $set: { is_online: true, last_seen: Math.floor(Date.now() / 1000) },
          }
        );
      }
      if (socket.handshake.query.role === 'user') {
        await Models.User.findByIdAndUpdate(
          { _id: socket.handshake.query.id },
          {
            $set: { is_online: true, last_seen: Math.floor(Date.now() / 1000) },
          }
        );
      }

      console.log('users connected: ', JSON.stringify(users));

      addUser(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} Connected`);

      socket.on('disconnect', async () => {
        const role = socket.handshake.query.role;
        const userId = socket.handshake.query.id;

        if (socket.handshake.query.role === 'laundry-man') {
          await Models.LaundryMan.findByIdAndUpdate(
            { _id: socket.handshake.query.id },
            {
              $set: {
                is_online: false,
                last_seen: Math.floor(Date.now() / 1000),
              },
            }
          );
        }
        if (socket.handshake.query.role === 'user') {
          await Models.User.findByIdAndUpdate(
            { _id: socket.handshake.query.id },
            {
              $set: {
                is_online: false,
                last_seen: Math.floor(Date.now() / 1000),
              },
            }
          );
        }
        socket.leave(userId);
        removeUser(socket.id);
        console.log(`User ${userId} disconnected`);
      });
    });

    function addUser(id, socketId) {
      let existingUserIndex = users.findIndex((u) => u?.id === id);

      if (existingUserIndex >= 0) {
        users[existingUserIndex].socketIds.push(socketId);
      } else {
        users.push({ id, socketIds: [socketId] });
      }
    }

    function removeUser(socketId) {
      users = users.map((user) => {
        const updatedUser = {
          ...user,
          socketIds: user?.socketIds.filter((id) => id !== socketId),
        };
        return updatedUser;
      });

      users = users.filter((user) => user?.socketIds?.length > 0);
    }
  }

  static getInstance() {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }
}

module.exports = SocketManager.getInstance();
