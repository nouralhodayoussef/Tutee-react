const { Server } = require('socket.io');

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    socket.on('join-room', ({ roomId }) => {
      const room = io.sockets.adapter.rooms.get(roomId);
      const numClients = room ? room.size : 0;

      socket.join(roomId);

      if (numClients === 1) {
        socket.emit('created-room'); // first peer
      } else {
        socket.emit('joined-room');  // second peer
      }

      // ✅ Always emit this AFTER joining
      socket.to(roomId).emit('user-joined');

      console.log(`✅ ${socket.id} joined room ${roomId}`);
    });

    socket.on('offer', ({ roomId, offer }) => {
      socket.to(roomId).emit('offer', { offer });
    });

    socket.on('answer', ({ roomId, answer }) => {
      socket.to(roomId).emit('answer', { answer });
    });

    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', { candidate });
    });

    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id);
    });
  });
}

module.exports = setupSocket;
