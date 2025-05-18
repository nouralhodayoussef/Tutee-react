const { Server } = require("socket.io");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    socket.on("join-room", ({ roomId }) => {
      const room = io.sockets.adapter.rooms.get(roomId);
      const numClients = room ? room.size : 0;

      socket.join(roomId);

      if (numClients === 1) {
        socket.emit("created-room");
      } else {
        socket.emit("joined-room");
      }

      socket.to(roomId).emit("user-joined");
      socket.roomId = roomId; // Save for later use

      console.log(`✅ ${socket.id} joined room ${roomId}`);
    });

    socket.on("offer", ({ roomId, offer }) => {
      socket.to(roomId).emit("offer", { offer });
    });

    socket.on("answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("answer", { answer });
    });

    socket.on("ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("ice-candidate", { candidate });
    });

    socket.on("disconnect", () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit("user-left");
      }
      console.log("🔴 Client disconnected:", socket.id);
    });

    // Whiteboard: Open for all users in room
    socket.on("open-whiteboard", ({ roomId }) => {
      socket.to(roomId).emit("open-whiteboard");
    });

    // Whiteboard: Close for all users in room
    socket.on("close-whiteboard", ({ roomId }) => {
      socket.to(roomId).emit("close-whiteboard");
    });

    // Whiteboard: Drawing data (path sync)
    socket.on("whiteboard-draw", ({ roomId, data }) => {
      socket.to(roomId).emit("whiteboard-draw", { data });
    });

    // Whiteboard: Clear all
    socket.on("whiteboard-clear", ({ roomId }) => {
      socket.to(roomId).emit("whiteboard-clear");
    });

    socket.on("whiteboard-action", ({ roomId, action }) => {
      socket.to(roomId).emit("whiteboard-action", { action });
    });
    socket.on("whiteboard-cursor", ({ roomId, cursor }) => {
      socket
        .to(roomId)
        .emit("whiteboard-cursor", { cursor, socketId: socket.id });
    });

    socket.on("chat-message", (msg) => {
      if (msg.roomId) {
        // Broadcast to everyone else in this room
        socket.to(msg.roomId).emit("chat-message", msg);
      } else {
        // fallback: just broadcast to everyone except sender
        socket.broadcast.emit("chat-message", msg);
      }
    });
  });
}

module.exports = setupSocket;
