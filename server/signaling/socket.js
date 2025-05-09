// /server/signaling/socket.js
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
    console.log("🔌 New client connected:", socket.id);

    socket.on("join-room", ({ roomId }) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-joined", socket.id);
      console.log(`📥 ${socket.id} joined room ${roomId}`);
    });

    socket.on("offer", ({ roomId, offer }) => {
      socket.to(roomId).emit("offer", { offer, sender: socket.id });
    });

    socket.on("answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("answer", { answer, sender: socket.id });
    });

    socket.on("ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("ice-candidate", { candidate, sender: socket.id });
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      rooms.forEach((roomId) => {
        socket.to(roomId).emit("user-left", socket.id);
      });
    });
  });

  return io;
}

module.exports = setupSocket;
