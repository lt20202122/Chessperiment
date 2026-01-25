import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { Chess } from "chess.js";
import path from "path";
import { createRequire } from "module";
import * as os from "os";
import { fileURLToPath } from "url";
import { createClient } from "redis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
// Load the loadEngine module - it's a CommonJS module that exports a function
// The IIFE in loadEngine.js executes and should export the function directly
const loadEnginePath = path.join(__dirname, "loadEngine.js");
const fs = require("fs");
const loadEngineCode = fs.readFileSync(loadEnginePath, "utf8");
// Create a temporary module context to execute the IIFE
const vm = require("vm");
// Create a require function that can access Node.js built-in modules
const nodeRequire = (moduleName) => {
  if (moduleName === "child_process") return require("child_process");
  if (moduleName === "path") return require("path");
  if (moduleName === "fs") return require("fs");
  // For other modules, try to require them
  try {
    return require(moduleName);
  } catch (e) {
    throw new Error(`Cannot find module '${moduleName}'`);
  }
};
const loadEngineContext = {
  module: { exports: {} },
  exports: {},
  require: nodeRequire,
  __dirname: __dirname,
  __filename: loadEnginePath,
  console: console,
  process: process,
  Buffer: Buffer,
  global: global,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
};
vm.createContext(loadEngineContext);
vm.runInContext(loadEngineCode, loadEngineContext);
const loadEngine =
  loadEngineContext.module.exports ||
  loadEngineContext.exports ||
  loadEngineContext.loadEngine;

if (typeof loadEngine !== "function") {
  throw new Error(
    `loadEngine is not a function. Got type: ${typeof loadEngine}, value: ${loadEngine}`,
  );
}

// Import Stockfish pool for efficient engine management
import { stockfishPool } from "./stockfish-pool.js";

// Redis client initialization
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

await redisClient.connect();
console.log("Connected to Redis");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
class Game {
  constructor(creatorPlayerId) {
    this.roomId = uuidv4().substring(0, 8).trim().toUpperCase();
    this.players = { white: creatorPlayerId };
    this.status = "waiting";
    this.board_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    this.history = [];
    this.chatMessages = [];
    this.pendingMove = null;
    this.rematchRequests = [];
  }
  addPlayer(playerId) {
    if (!this.players.black) {
      this.players.black = playerId;
    }
  }
  getColorForPlayer(playerId) {
    if (this.players.white === playerId) return "w";
    if (this.players.black === playerId) return "b";
    return null;
  }
}
const games = new Map();
const playerToRoom = new Map();

// Redis helpers
async function saveGame(game) {
  if (!game || !game.roomId) return;
  try {
    const gameData = JSON.stringify({
      roomId: game.roomId,
      players: game.players,
      status: game.status,
      board_fen: game.board_fen,
      history: game.history,
      chatMessages: game.chatMessages,
      pendingMove: game.pendingMove,
      rematchRequests: game.rematchRequests || [],
    });
    await redisClient.set(`game:${game.roomId}`, gameData, {
      EX: 3600 * 24, // Expire after 24 hours
    });
  } catch (err) {
    console.error("Error saving game to Redis:", err);
  }
}

async function getGame(roomId) {
  if (games.has(roomId)) return games.get(roomId);
  try {
    const data = await redisClient.get(`game:${roomId}`);
    if (data) {
      const parsed = JSON.parse(data);
      const game = new Game(parsed.players.white);
      Object.assign(game, parsed);
      games.set(roomId, game);
      // Re-map players
      if (game.players.white) playerToRoom.set(game.players.white, roomId);
      if (game.players.black) playerToRoom.set(game.players.black, roomId);
      return game;
    }
  } catch (err) {
    console.error("Error getting game from Redis:", err);
  }
  return null;
}

const socketToPlayer = new Map();
const playerToSocket = new Map();

// Redis search queue helper
async function addToSearchQueue(playerId) {
  try {
    await redisClient.rPush("searchQueue", playerId);
  } catch (err) {
    console.error("Error adding to search queue:", err);
  }
}

async function removeFromQueue(playerId) {
  try {
    // Note: LREM removes occurances. 0 means all.
    await redisClient.lRem("searchQueue", 0, playerId);
    console.log("Removed player from search queue:", playerId);
    const sid = playerToSocket.get(playerId);
    if (sid) io.to(sid).emit("search_cancelled");
  } catch (err) {
    console.error("Error removing from search queue:", err);
  }
}

async function matchmake() {
  try {
    const queueLen = await redisClient.lLen("searchQueue");
    if (queueLen < 2) return;

    const p1 = await redisClient.lPop("searchQueue");
    const p2 = await redisClient.lPop("searchQueue");

    if (!p1 || !p2) {
      if (p1) await redisClient.rPush("searchQueue", p1);
      if (p2) await redisClient.rPush("searchQueue", p2);
      return;
    }

    const s1Id = playerToSocket.get(p1);
    const s2Id = playerToSocket.get(p2);
    const socket1 = s1Id ? io.sockets.sockets.get(s1Id) : null;
    const socket2 = s2Id ? io.sockets.sockets.get(s2Id) : null;

    if (!socket1) {
      await redisClient.rPush("searchQueue", p2);
      return;
    }
    if (!socket2) {
      await redisClient.rPush("searchQueue", p1);
      return;
    }

    const game = new Game(p1);
    game.addPlayer(p2);
    game.status = "playing";
    games.set(game.roomId, game);
    await saveGame(game);
    await savePlayerRoom(p1, game.roomId);
    await savePlayerRoom(p2, game.roomId);

    const p1IsWhite = Math.random() > 0.5;
    if (!p1IsWhite) {
      game.players.white = p2;
      game.players.black = p1;
      await saveGame(game);
    }

    socket1.join(game.roomId);
    socket2.join(game.roomId);

    io.to(s1Id).emit("match_found", {
      roomId: game.roomId,
      color: p1IsWhite ? "white" : "black",
      fen: game.board_fen,
      status: "playing",
    });
    io.to(s2Id).emit("match_found", {
      roomId: game.roomId,
      color: p1IsWhite ? "black" : "white",
      fen: game.board_fen,
      status: "playing",
    });

    // Check if more can be matched
    matchmake();
  } catch (err) {
    console.error("Error in matchmaking:", err);
  }
}

const checkGameStatus = (game) => {
  try {
    if (!game) return false;
    const chess = new Chess(game.board_fen);
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "Black" : "White";
      game.status = "ended";
      return {
        gameInfo: `Checkmate! ${winner} wins!`,
        result: chess.turn() === "w" ? "b" : "w",
      };
    }
    if (chess.isStalemate()) {
      game.status = "ended";
      return { gameInfo: "Draw by Stalemate", result: "0" };
    }
    if (chess.isThreefoldRepetition()) {
      game.status = "ended";
      return { gameInfo: "Draw by Repetition", result: "0" };
    }
    if (chess.isInsufficientMaterial()) {
      game.status = "ended";
      return { gameInfo: "Draw by Insufficient Material", result: "0" };
    }
    if (chess.isDraw()) {
      game.status = "ended";
      return { gameInfo: "Draw", result: "0" };
    }
    if (chess.isCheck()) {
      return { gameInfo: "Check!", result: "playing" };
    }
    return false;
  } catch (e) {
    console.error("checkGameStatus error:", e);
    return false;
  }
};

// Redis mapping helper
async function savePlayerRoom(playerId, roomId) {
  try {
    await redisClient.set(`playerRoom:${playerId}`, roomId, {
      EX: 3600 * 24,
    });
    playerToRoom.set(playerId, roomId);
  } catch (err) {
    console.error("Error saving playerRoom to Redis:", err);
  }
}

async function getPlayerRoom(playerId) {
  if (playerToRoom.has(playerId)) return playerToRoom.get(playerId);
  try {
    const roomId = await redisClient.get(`playerRoom:${playerId}`);
    if (roomId) {
      playerToRoom.set(playerId, roomId);
      return roomId;
    }
  } catch (err) {
    console.error("Error getting playerRoom from Redis:", err);
  }
  return null;
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);
  // --- Server-Side Stockfish (POOLED - MEMORY EFFICIENT) ---
  socket.on("request_computer_move", async (data) => {
    const { roomId, difficulty } = data;
    const playerId = socketToPlayer.get(socket.id);

    // SECURITY: Get state from server, NOT from client FEN
    const game = roomId ? await getGame(roomId) : null;

    if (!game) {
      console.error(`[Stockfish] Unauthorized or invalid room: ${roomId}`);
      return;
    }

    if (game.status !== "playing") {
      console.warn(`[Stockfish] Game not in progress: ${game.status}`);
      return;
    }

    console.log(
      `[Stockfish] Thinking for Room: ${roomId}, FEN: ${game.board_fen}, Diff: ${difficulty}`,
    );

    try {
      const bestMove = await stockfishPool.getBestMove(
        game.board_fen,
        difficulty,
      );

      if (bestMove) {
        console.log("[Stockfish] Best move found:", bestMove);
        socket.emit("computer_move_result", { bestMove });
      } else {
        socket.emit("computer_move_result", { bestMove: null });
      }
    } catch (error) {
      console.error("[Stockfish] Error processing move:", error);
      socket.emit("computer_move_result", { bestMove: null });
    }
  });

  socket.on("find_match", async () => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;
    console.log("Quick search requested from socket:", socket.id);
    console.log("✅ Player entered quick search:", playerId);
    await addToSearchQueue(playerId);
    socket.emit("quick_search_started");
    matchmake();
  });

  socket.on("cancel_search", async () => {
    const playerId = socketToPlayer.get(socket.id);
    if (playerId) await removeFromQueue(playerId);
  });

  socket.on("register_player", async (data) => {
    const playerId = data.playerId;
    const oldPlayerId = socketToPlayer.get(socket.id);
    if (oldPlayerId && oldPlayerId !== playerId) {
      console.log(
        `🔄 Identity transfer on socket ${socket.id}: ${oldPlayerId} -> ${playerId}`,
      );
      const roomId = await getPlayerRoom(oldPlayerId);
      if (roomId) {
        const game = await getGame(roomId);
        if (game) {
          if (game.players.white === oldPlayerId) game.players.white = playerId;
          if (game.players.black === oldPlayerId) game.players.black = playerId;
          await saveGame(game);
          await savePlayerRoom(playerId, roomId);
          // Cleanup old mapping potentially, but Redis handles expiry
          playerToRoom.delete(oldPlayerId);
          await redisClient.del(`playerRoom:${oldPlayerId}`);
        }
      }
      const qIdx = searchQueue.indexOf(oldPlayerId);
      if (qIdx > -1) searchQueue[qIdx] = playerId;
    }
    const currentActiveSocket = playerToSocket.get(playerId);
    if (currentActiveSocket && currentActiveSocket !== socket.id) {
      socketToPlayer.delete(currentActiveSocket);
    }
    socketToPlayer.set(socket.id, playerId);
    playerToSocket.set(playerId, socket.id);
    console.log(
      `[Register] Player ${playerId} registered on socket ${socket.id}. Active games: ${games.size}`,
    );
    const roomId = await getPlayerRoom(playerId);
    if (roomId) {
      const game = await getGame(roomId);
      if (game && game.status !== "ended") {
        socket.join(roomId);
        const color = game.getColorForPlayer(playerId);
        console.log(
          `[Rejoin] Found room ${roomId} for player ${playerId}. Color: ${color}`,
        );
        socket.emit("rejoin_game", {
          roomId,
          color: color === "w" ? "white" : color === "b" ? "black" : "",
          fen: game.board_fen,
          status: game.status,
          history: game.history,
          chatMessages: game.chatMessages,
        });
      }
    }
  });

  socket.on("offer_draw", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    if (roomId) socket.to(roomId).emit("draw_offered", { from: playerId });
  });
  socket.on("accept_draw", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game && game.status === "playing") {
      game.status = "ended";
      await saveGame(game);
      io.to(roomId).emit("game_ended", {
        reason: "Draw Accepted",
        result: "0",
        status: "ended",
      });
    }
  });
  socket.on("decline_draw", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    if (roomId) socket.to(roomId).emit("draw_declined");
  });

  socket.on("request_fen", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game) socket.emit("receive_fen", { board_fen: game.board_fen });
  });
  socket.on("request_history", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game) socket.emit("receive_history", { history: game.history });
  });
  socket.on("request_game_status", async (callback) => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game) callback(game.status);
  });

  socket.on("create_room", async () => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;
    removeFromQueue(playerId);
    const game = new Game(playerId);
    games.set(game.roomId.toUpperCase(), game);
    await saveGame(game);
    await savePlayerRoom(playerId, game.roomId);
    socket.join(game.roomId);
    socket.emit("room_created", { roomId: game.roomId, color: "white" });
  });

  socket.on("join_room", async (data) => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId || !data.roomId) {
      socket.emit("error", {
        message: "Player not registered or no room ID provided",
      });
      return;
    }
    const roomId = data.roomId.trim().toUpperCase();

    // Handle computer games - Create a persistent server-side game object
    if (data.isComputer || roomId.startsWith("COMPUTER-")) {
      const compRoomId = roomId.startsWith("COMPUTER-")
        ? roomId
        : `COMPUTER-${playerId}`;
      console.log(
        `[Computer Game] Initializing server-side state for Room: ${compRoomId}`,
      );

      let game = await getGame(compRoomId);
      if (!game) {
        game = new Game(playerId);
        game.roomId = compRoomId;
        game.players.black = "STOCKFISH";
        game.status = "playing";
        games.set(compRoomId, game);
      }

      await saveGame(game);
      await savePlayerRoom(playerId, compRoomId);
      socket.join(compRoomId);
      socket.emit("joined_room", { roomId: compRoomId, color: "white" });

      // If rejoining, send current state
      if (game.history.length > 0) {
        socket.emit("rejoin_game", {
          roomId: compRoomId,
          color: "white",
          fen: game.board_fen,
          status: game.status,
          history: game.history,
          chatMessages: game.chatMessages,
        });
      }
      return;
    }

    const game = await getGame(roomId);
    console.log(
      `[Join Room Request] Room: ${roomId}, Player: ${playerId}. Game found: ${!!game}`,
    );
    if (!game) {
      console.log(
        `[Join Room] Room ${roomId} not found for player ${playerId}`,
      );
      socket.emit("room_not_found", { roomId });
      return;
    }
    const existingColor = game.getColorForPlayer(playerId);
    if (existingColor) {
      console.log(
        `[Join Room] Player ${playerId} already in room ${roomId}. Sending rejoin.`,
      );
      await savePlayerRoom(playerId, roomId);
      socket.join(roomId);
      socket.emit("rejoin_game", {
        roomId,
        color: existingColor === "w" ? "white" : "black",
        fen: game.board_fen,
        status: game.status,
        history: game.history,
        chatMessages: game.chatMessages,
      });
      return;
    }
    if (game.players.white && game.players.black) {
      console.log(
        `[Join Room] Room ${roomId} is full. Player ${playerId} joining as spectator.`,
      );
      socket.join(roomId);
      socket.emit("rejoin_game", {
        roomId,
        color: "",
        fen: game.board_fen,
        status: game.status,
        history: game.history,
        chatMessages: game.chatMessages,
      });
      return;
    }
    game.addPlayer(playerId);
    await saveGame(game);
    await savePlayerRoom(playerId, roomId);
    socket.join(roomId);
    removeFromQueue(playerId);
    socket.emit("joined_room", { roomId, color: "black" });
    if (game.players.white && game.players.black) {
      game.status = "playing";
      await saveGame(game);
      io.to(roomId).emit("start_game", {
        roomId,
        fen: game.board_fen,
        status: "playing",
      });
    }
  });

  socket.on("move", async (data) => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (!game || game.status !== "playing") return;
    const color = game.getColorForPlayer(playerId);
    if (!color) return;
    try {
      const chess = new Chess(game.board_fen);
      if (chess.turn() !== color) {
        console.warn(
          `[Move Rejected] Wrong turn in room ${roomId}. Expected: ${chess.turn()}, Got: ${color}`,
        );
        socket.emit("error", { message: "Not your turn" });
        socket.emit("receive_fen", { board_fen: game.board_fen });
        return;
      }
      const piece = chess.get(data.from);
      const toRank = parseInt(data.to.match(/\d+/)?.[0] || "0", 10);
      const boardHeight = 8; // Default for chess.js, but prepared for future expansion
      const isPawnPromotion =
        piece &&
        piece.type === "p" &&
        ((piece.color === "w" && toRank === boardHeight) ||
          (piece.color === "b" && toRank === 1));
      console.log(
        `[Move Request] Room: ${roomId}, Player: ${playerId}, Move: ${data.from}->${data.to}, Promotion: ${data.promotion}, IsPromo: ${isPawnPromotion}`,
      );
      if (isPawnPromotion && !data.promotion) {
        console.log(
          `[Promotion Needed] Room: ${roomId}, Move: ${data.from}->${data.to}`,
        );
        socket.emit("promotion_needed", { from: data.from, to: data.to });
        game.pendingMove = { from: data.from, to: data.to };
        await saveGame(game);
        return;
      }
      const moveResult = chess.move({
        from: data.from,
        to: data.to,
        promotion: data.promotion,
      });
      if (moveResult) {
        console.log(`[Move Accepted] Room: ${roomId}, SAN: ${moveResult.san}`);
        game.board_fen = chess.fen();
        game.history.push(moveResult.san);
        game.pendingMove = null; // Clear any pending promotion
        const status = checkGameStatus(game);
        await saveGame(game);
        io.to(roomId).emit("move", {
          from: moveResult.from,
          to: moveResult.to,
          promotion: moveResult.promotion,
          san: moveResult.san,
          fen: game.board_fen,
          gameStatus: game.status,
        });
        if (game.status === "ended" && status) {
          io.to(roomId).emit("game_ended", {
            reason: status.gameInfo,
            result: status.result,
            status: "ended",
          });
        }
      } else {
        console.warn(
          `[Move Rejected] Invalid move attempted in room ${roomId}: ${data.from}-${data.to}`,
        );
        socket.emit("error", { message: "Invalid move" });
        socket.emit("receive_fen", { board_fen: game.board_fen }); // Resync client
      }
    } catch (err) {
      console.error(`[Move Error] Room ${roomId}:`, err);
      socket.emit("error", { message: "Move validation error" });
      const currentRoomGame = roomId ? await getGame(roomId) : null;
      if (currentRoomGame) {
        socket.emit("receive_fen", { board_fen: currentRoomGame.board_fen });
      }
    }
  });

  socket.on("resign", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game && game.status === "playing") {
      const myColor = game.getColorForPlayer(playerId);
      game.status = "ended";
      await saveGame(game);
      io.to(roomId).emit("game_ended", {
        reason: "Resigned",
        result: myColor === "w" ? "b" : "w",
        status: "ended",
      });
    }
  });
  socket.on("chat_message", async (data) => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    if (roomId) {
      const game = await getGame(roomId);
      if (game) {
        game.chatMessages.push({ message: data.message, playerId: playerId });
        await saveGame(game);
      }
      io.to(roomId).emit("chat_message", { message: data.message, playerId });
    }
  });

  socket.on("request_rematch", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;

    if (!game || game.status !== "ended") return;

    if (!game.rematchRequests) game.rematchRequests = [];
    if (!game.rematchRequests.includes(playerId)) {
      game.rematchRequests.push(playerId);
      await saveGame(game);

      // Notify other player
      socket.to(roomId).emit("rematch_requested", { from: playerId });

      // Check if both agreed
      if (game.rematchRequests.length >= 2) {
        // Create new game - Swap colors
        const newGame = new Game(game.players.black); // winner of previous or just swap
        newGame.addPlayer(game.players.white);
        newGame.status = "playing";

        games.set(newGame.roomId.toUpperCase(), newGame);
        await saveGame(newGame);

        // Map players to new room
        await savePlayerRoom(newGame.players.white, newGame.roomId);
        await savePlayerRoom(newGame.players.black, newGame.roomId);

        io.to(roomId).emit("rematch_accepted", { newRoomId: newGame.roomId });
      }
    }
  });

  socket.on("find_next_game", async () => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;

    console.log("Find next game requested:", playerId);
    await addToSearchQueue(playerId);
    socket.emit("quick_search_started");
    matchmake();
  });

  socket.on("disconnect", () => {
    const playerId = socketToPlayer.get(socket.id);
    if (playerId && playerToSocket.get(playerId) === socket.id) {
      console.log("Active socket disconnected:", playerId);
    }
    socketToPlayer.delete(socket.id);
  });
});
const PORT = process.env.PORT || 3002;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (iface) {
      for (const alias of iface) {
        if (
          alias.family === "IPv4" &&
          alias.address !== "127.0.0.1" &&
          !alias.internal
        ) {
          console.log(`📡 Local Network IP: http://${alias.address}:${PORT}`);
        }
      }
    }
  }
});
