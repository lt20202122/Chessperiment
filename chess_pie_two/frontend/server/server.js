const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://chessgamedev-l-ts-projects-95f31583.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

// NUR IN-MEMORY SPEICHERUNG (keine Datenbank!)
const activeRooms = new Map();

function generateRoomKey() {
  const timestamp = Date.now().toString(36);
  const uuid = uuidv4().replace(/-/g, "").substring(0, 16);
  return `${timestamp}-${uuid}`.toUpperCase();
}

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Raum erstellen
  socket.on("create_room", () => {
    const roomKey = generateRoomKey();

    activeRooms.set(roomKey, {
      id: roomKey,
      creator: socket.id,
      players: [socket.id],
      createdAt: Date.now(),
      gameState: null,
    });

    socket.join(roomKey);
    console.log(`Room created: ${roomKey}`);

    socket.emit("room_created", { roomKey });
  });

  // Raum suchen
  socket.on("search_room", (data) => {
    const roomKey = data.roomKey.trim().toUpperCase();
    const room = activeRooms.get(roomKey);

    if (!room) {
      socket.emit("room_not_found", {
        message: "Raum nicht gefunden",
      });
      return;
    }

    socket.emit("room_found", {
      roomKey: roomKey,
      playerCount: room.players.length,
      isFull: room.players.length >= 2,
    });
  });

  // Raum beitreten
  socket.on("join_room", (data) => {
    const roomKey = data.room;
    const room = activeRooms.get(roomKey);

    if (!room) {
      socket.emit("error", { message: "Raum nicht gefunden" });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("error", { message: "Raum ist voll" });
      return;
    }

    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    socket.join(roomKey);

    socket.emit("joined_room", { roomKey });
    socket.to(roomKey).emit("player_joined", {
      playerId: socket.id,
      playerCount: room.players.length,
    });
  });

  // Chat
  socket.on("chat", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  // Draw anbieten
  socket.on("offer_draw", (data) => {
    socket.to(data.room).emit("offer_draw", data);
  });

  // Aufgeben
  socket.on("resign", (data) => {
    socket.to(data.room).emit("resign", data);
  });

  // Zug
  socket.on("move", (data) => {
    socket.to(data.room).emit("move", data);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);

    activeRooms.forEach((room, roomKey) => {
      if (room.players.includes(socket.id)) {
        room.players = room.players.filter((id) => id !== socket.id);

        socket.to(roomKey).emit("player_left", {
          playerId: socket.id,
        });

        // Raum löschen wenn leer
        if (room.players.length === 0) {
          activeRooms.delete(roomKey);
          console.log(`Room deleted: ${roomKey}`);
        }
      }
    });
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING on port 3001");
});
