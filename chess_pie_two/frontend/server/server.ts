import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { Chess } from "chess.js";

type GameStatus = "waiting" | "in-game" | "finished";

interface Room {
  id: string;
  creatorUserId: string;
  players: string[];
  sockets: Record<string, string>;
  white?: string;
  black?: string;
  createdAt: number;
  lastActivityAt: number;
  status: GameStatus;
  chess: Chess;
  lastMoveTimestamp: number;
  pendingDrawOffer?: string;
  moveCount: number;
  disconnectedSince?: Record<string, number>;
  cleanupTimer?: NodeJS.Timeout | null;
}

interface MovePayload {
  room: string;
  from?: string;
  to?: string;
  promotion?: string;
  castle?: string;
}

interface RequestStatePayload {
  room: string;
}

const app = express();
app.use(cors());

app.get("/health", (req, res) => res.json({ status: "ok", activeRooms: activeRooms.size, ts: Date.now() }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://chessgamedev-l-ts-projects-95f31583.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000,
  pingInterval: 25000,
});

const activeRooms: Map<string, Room> = new Map();
const userIdToSocket: Map<string, string> = new Map();
const socketIdToUserId: Map<string, string> = new Map();
const userToRoom: Map<string, string> = new Map();

class RateLimiter {
  private map = new Map<string, number[]>();
  check(key: string, max: number, windowMs: number) {
    const now = Date.now();
    const arr = this.map.get(key) || [];
    const filtered = arr.filter((t) => now - t < windowMs);
    if (filtered.length >= max) return false;
    filtered.push(now);
    this.map.set(key, filtered);
    return true;
  }
  reset(key: string) {
    this.map.delete(key);
  }
}

const moveLimiter = new RateLimiter();
const chatLimiter = new RateLimiter();
const roomCreationLimiter = new RateLimiter();
const actionLimiter = new RateLimiter();

const MAX_ROOMS = 10000;
const RECONNECT_GRACE_MS = 120_000;

function generateRoomKey(): string {
  const ts = Date.now().toString(36);
  const uuid = uuidv4().replace(/-/g, "").substring(0, 12);
  return `${ts}-${uuid}`.toUpperCase();
}

function getRoomForUser(roomId: string, userId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return { error: "room_not_found", room: null };
  if (!room.players.includes(userId)) return { error: "not_in_room", room: null };
  return { error: null, room };
}

function sendRoomStateToSocket(socketId: string, room: Room) {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return;
  socket.emit("room_state", {
    roomKey: room.id,
    fen: room.chess.fen(),
    history: room.chess.history(),
    status: room.status,
    white: room.white,
    black: room.black,
    players: room.players,
    lastMove: room.chess.history().slice(-1)[0] ?? null,
  });
}

function broadcastRoomState(room: Room) {
  io.to(room.id).emit("room_state", {
    roomKey: room.id,
    fen: room.chess.fen(),
    history: room.chess.history(),
    status: room.status,
    white: room.white,
    black: room.black,
    players: room.players,
    lastMove: room.chess.history().slice(-1)[0] ?? null,
  });
}

function scheduleRemoveUserFromRoom(room: Room, userId: string) {
  room.disconnectedSince = room.disconnectedSince || {};
  room.disconnectedSince[userId] = Date.now();

  if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
  room.cleanupTimer = setTimeout(() => {
    const ds = room.disconnectedSince && room.disconnectedSince[userId];
    if (!ds) return;
    const elapsed = Date.now() - ds;
    if (elapsed >= RECONNECT_GRACE_MS) {
      room.players = room.players.filter((u) => u !== userId);
      delete room.sockets[userId];
      delete (room.disconnectedSince as any)[userId];

      if (room.status === "in-game") {
        room.status = "finished";
        io.to(room.id).emit("game_over", { reason: "player_disconnected", disconnectedUser: userId });
      } else {
        io.to(room.id).emit("player_left", { userId });
      }

      userToRoom.delete(userId);

      if (room.players.length === 0) {
        activeRooms.delete(room.id);
        console.log(`Room ${room.id} deleted (empty after graceful removal)`);
      }
    }
  }, RECONNECT_GRACE_MS + 2000);
}

function clearDisconnectMark(room: Room, userId: string) {
  if (room.disconnectedSince && room.disconnectedSince[userId]) {
    delete room.disconnectedSince[userId];
  }
}

function handleUserReconnection(socket: Socket, userId: string, roomKey: string) {
  const room = activeRooms.get(roomKey);
  if (!room || !room.players.includes(userId)) {
    userToRoom.delete(userId); // Bereinigen, falls der Raum nicht mehr existiert
    return;
  }
  room.sockets[userId] = socket.id;
  socket.join(roomKey);
  clearDisconnectMark(room, userId);
  broadcastRoomState(room); // Sende den Zustand an alle im Raum
  io.to(roomKey).emit("player_reconnected", { userId });
  console.log(`user ${userId} reconnected to room ${roomKey}`);
}

io.on("connection", (socket: Socket) => {
  console.log(`socket connected: ${socket.id}`);

  socket.on("authenticate", (data: any) => {
    try {
      if (!data || typeof data.userId !== "string" || data.userId.length === 0) {
        socket.emit("error", { message: "invalid_auth" });
        return;
      }
      const userId = data.userId;
      socketIdToUserId.set(socket.id, userId);
      userIdToSocket.set(userId, socket.id);
      console.log(`user authenticated: ${userId} -> socket ${socket.id}`);

      const roomKey = userToRoom.get(userId);
      if (roomKey && activeRooms.has(roomKey)) {
        handleUserReconnection(socket, userId, roomKey);
      }
    } catch (err) {
      console.error("authenticate error", err);
      socket.emit("error", { message: "auth_failed" });
    }
  });

  // ---- CREATE ROOM ----
  socket.on("create_room", () => {
    try {
      const userId = socketIdToUserId.get(socket.id);
      if (!userId) {
        socket.emit("error", { message: "not_authenticated" });
        return;
      }
      if (!roomCreationLimiter.check(userId, 5, 60000)) {
        socket.emit("error", { message: "too_many_rooms" });
        return;
      }
      if (activeRooms.size >= MAX_ROOMS) {
        socket.emit("error", { message: "server_capacity_reached" });
        return;
      }
      const existingRoomId = userToRoom.get(userId);
      if (existingRoomId) {
        socket.emit("error", { message: "already_in_room", roomKey: existingRoomId });
        return;
      }

      const roomKey = generateRoomKey();
      const chess = new Chess();
      const now = Date.now();
      const room: Room = {
        id: roomKey,
        creatorUserId: userId,
        players: [userId],
        sockets: { [userId]: socket.id },
        white: userId,
        createdAt: now,
        lastActivityAt: now,
        status: "waiting",
        chess,
        lastMoveTimestamp: 0,
        moveCount: 0,
        disconnectedSince: {},
        cleanupTimer: null,
      };
      activeRooms.set(roomKey, room);
      userToRoom.set(userId, roomKey);
      socket.join(roomKey);

      socket.emit("room_created", { roomKey });
      console.log(`room ${roomKey} created by ${userId}`);
    } catch (err) {
      console.error("create_room error", err);
      socket.emit("error", { message: "create_room_failed" });
    }
  });

  // ---- QUICK MATCH ----
  socket.on("quick_match", () => {
    try {
      const userId = socketIdToUserId.get(socket.id);
      if (!userId) {
        socket.emit("error", { message: "not_authenticated" });
        return;
      }
      const existingRoomId = userToRoom.get(userId);
      if (existingRoomId) {
        socket.emit("error", { message: "already_in_room", roomKey: existingRoomId });
        return;
      }

      let foundRoom: Room | null = null;
      for (const [, room] of activeRooms) {
        if (room.status === "waiting" && room.players.length === 1) {
          foundRoom = room;
          break;
        }
      }

      let roomKey: string;
      if (foundRoom) {
        const room = foundRoom;
        room.players.push(userId);
        room.sockets[userId] = socket.id;
        room.white = room.players[0];
        room.black = room.players[1];
        room.status = "in-game";
        room.lastActivityAt = Date.now();
        userToRoom.set(userId, room.id);
        socket.join(room.id);

        // Sende "start_game" an alle im Raum
        io.to(room.id).emit("start_game", {
          roomKey: room.id,
          white: room.white,
          black: room.black,
          fen: room.chess.fen(),
        });
        // Teile dem beitretenden Spieler explizit mit, dass er beigetreten ist und schwarz ist
        socket.emit("joined_room", { roomKey: room.id, color: "black" });
        console.log(`quick_match: ${userId} joined ${room.id}`);
      } else {
        // create new waiting room
        const chess = new Chess(); // Instanz wird bereits in Zeile 277 erstellt, kann hier entfernt werden
        const now = Date.now();
        roomKey = generateRoomKey();
        const newRoom: Room = {
          id: roomKey,
          creatorUserId: userId,
          players: [userId],
          sockets: { [userId]: socket.id },
          white: userId,
          createdAt: now,
          lastActivityAt: now,
          status: "waiting",
          chess,
          lastMoveTimestamp: 0,
          moveCount: 0,
          disconnectedSince: {},
          cleanupTimer: null,
        };
        activeRooms.set(roomKey, newRoom);
        userToRoom.set(userId, roomKey);
        socket.join(roomKey);
        // Sende "room_created" nur, wenn ein neuer Raum erstellt wird
        socket.emit("room_created", { roomKey });
        console.log(`quick_match: ${userId} created new waiting room ${roomKey}`);
      }
    } catch (err) {
      console.error("quick_match error", err);
      socket.emit("error", { message: "quick_match_failed" });
    }
  });

  // ---- JOIN ROOM, REQUEST STATE, MOVE, CHAT usw. bleiben unverändert ----
  // ... Hier kannst du die bisherigen Event-Handler für join_room, move, chat, resign etc. übernehmen ...

  socket.on("disconnect", (reason) => {
    console.log(`socket disconnected: ${socket.id}, reason: ${reason}`);
    const userId = socketIdToUserId.get(socket.id);
    if (userId) {
      const roomKey = userToRoom.get(userId);
      if (roomKey) {
        const room = activeRooms.get(roomKey);
        if (room) {
          io.to(roomKey).emit("player_disconnected", { userId });
          scheduleRemoveUserFromRoom(room, userId);
        }
      }
    }
    userIdToSocket.delete(userId as string); // Bereinigt die veraltete UserID -> SocketID Zuordnung
    socketIdToUserId.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`Chess Server Running on ${PORT}`);
  console.log("=".repeat(60));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM: broadcasting server_shutdown");
  io.emit("server_shutdown", { message: "Server shutting down" });
  server.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  console.log("SIGINT: closing");
  io.emit("server_shutdown", { message: "Server shutting down" });
  server.close(() => process.exit(0));
});
