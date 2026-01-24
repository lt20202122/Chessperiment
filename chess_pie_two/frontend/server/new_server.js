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
    clearInterval: clearInterval
};
vm.createContext(loadEngineContext);
vm.runInContext(loadEngineCode, loadEngineContext);
const loadEngine = loadEngineContext.module.exports || loadEngineContext.exports || loadEngineContext.loadEngine;

if (typeof loadEngine !== "function") {
    throw new Error(`loadEngine is not a function. Got type: ${typeof loadEngine}, value: ${loadEngine}`);
}
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
    }
    addPlayer(playerId) {
        if (!this.players.black) {
            this.players.black = playerId;
        }
    }
    getColorForPlayer(playerId) {
        if (this.players.white === playerId)
            return "w";
        if (this.players.black === playerId)
            return "b";
        return null;
    }
}
const games = new Map();
const playerToRoom = new Map();
const socketToPlayer = new Map();
const playerToSocket = new Map();
const searchQueue = [];
const removeFromQueue = (playerId) => {
    const index = searchQueue.indexOf(playerId);
    if (index > -1) {
        searchQueue.splice(index, 1);
        console.log("Removed player from search queue:", playerId);
        const sid = playerToSocket.get(playerId);
        if (sid)
            io.to(sid).emit("search_cancelled");
    }
};
const checkGameStatus = (game) => {
    try {
        if (!game)
            return false;
        const chess = new Chess(game.board_fen);
        if (chess.isCheckmate()) {
            const winner = chess.turn() === "w" ? "Black" : "White";
            game.status = "ended";
            return { gameInfo: `Checkmate! ${winner} wins!`, result: chess.turn() === "w" ? "b" : "w" };
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
    }
    catch (e) {
        console.error("checkGameStatus error:", e);
        return false;
    }
};
io.on("connection", (socket) => {
    console.log("connected:", socket.id);
    // --- Server-Side Stockfish ---
    socket.on("request_computer_move", (data) => {
        const { fen, difficulty } = data;
        console.log(`[Stockfish] Request for FEN: ${fen}, Diff: ${difficulty}`);
        try {
            const stockfishPath = path.join(__dirname, "node_modules", "stockfish", "src", "stockfish-17.1-8e4d048.js");
            const engine = loadEngine(stockfishPath);
            let hasResponded = false;
            // Timeout after 15 seconds
            const timeout = setTimeout(() => {
                if (!hasResponded) {
                    console.error("[Stockfish] Timeout waiting for move");
                    hasResponded = true;
                    try {
                        engine.quit();
                    }
                    catch (e) {
                        console.error("[Stockfish] Error quitting engine:", e);
                    }
                    socket.emit("computer_move_result", { bestMove: null });
                }
            }, 15000);
            const skillLevel = Math.max(0, Math.min(20, Math.floor((difficulty - 400) / 100)));
            const depth = Math.max(1, Math.min(20, Math.floor(difficulty / 150)));
            console.log(`[Stockfish] Skill level: ${skillLevel}, Depth: ${depth}`);
            // Initialize engine and send commands in sequence
            engine.send("uci", () => {
                console.log("[Stockfish] UCI initialized");
                engine.send(`setoption name Skill Level value ${skillLevel}`, () => {
                    console.log("[Stockfish] Skill level set");
                    engine.send(`ucinewgame`, () => {
                        console.log("[Stockfish] New game initialized");
                        engine.send(`position fen ${fen}`, () => {
                            console.log("[Stockfish] Position set");
                            engine.send(`go depth ${depth}`, (result) => {
                                if (hasResponded) {
                                    console.log("[Stockfish] Already responded, ignoring duplicate");
                                    return;
                                }
                                clearTimeout(timeout);
                                hasResponded = true;
                                console.log("[Stockfish] Raw output:", result);
                                const match = result.match(/bestmove\s+(\S+)/);
                                const bestMove = match ? match[1] : null;
                                if (bestMove && bestMove !== '(none)') {
                                    console.log("[Stockfish] Best move found:", bestMove);
                                    socket.emit("computer_move_result", { bestMove });
                                }
                                else {
                                    console.error("[Stockfish] No valid bestmove found in output:", result);
                                    socket.emit("computer_move_result", { bestMove: null });
                                }
                                try {
                                    engine.quit();
                                }
                                catch (e) {
                                    console.error("[Stockfish] Error quitting engine:", e);
                                }
                            });
                        });
                    });
                });
            });
        }
        catch (e) {
            console.error("[Stockfish] Error initializing engine:", e);
            socket.emit("computer_move_result", { bestMove: null });
        }
    });
    socket.on("find_match", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId)
            return;
        console.log("Quick search requested from socket:", socket.id);
        console.log("✅ Player entered quick search:", playerId);
        if (!searchQueue.includes(playerId)) {
            searchQueue.push(playerId);
        }
        socket.emit("quick_search_started");
        while (searchQueue.length >= 2) {
            const p1 = searchQueue[0];
            const p2 = searchQueue[1];
            const s1Id = playerToSocket.get(p1);
            const s2Id = playerToSocket.get(p2);
            const socket1 = s1Id ? io.sockets.sockets.get(s1Id) : null;
            const socket2 = s2Id ? io.sockets.sockets.get(s2Id) : null;
            if (!socket1) {
                searchQueue.shift();
                continue;
            }
            if (!socket2) {
                searchQueue.splice(1, 1);
                continue;
            }
            searchQueue.shift();
            searchQueue.shift();
            const game = new Game(p1);
            game.addPlayer(p2);
            game.status = "playing";
            games.set(game.roomId, game);
            playerToRoom.set(p1, game.roomId);
            playerToRoom.set(p2, game.roomId);
            const p1IsWhite = Math.random() > 0.5;
            if (!p1IsWhite) {
                game.players.white = p2;
                game.players.black = p1;
            }
            socket1.join(game.roomId);
            socket2.join(game.roomId);
            io.to(s1Id).emit("match_found", {
                roomId: game.roomId,
                color: p1IsWhite ? "white" : "black",
                fen: game.board_fen,
                status: "playing"
            });
            io.to(s2Id).emit("match_found", {
                roomId: game.roomId,
                color: p1IsWhite ? "black" : "white",
                fen: game.board_fen,
                status: "playing"
            });
        }
    });
    socket.on("cancel_search", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (playerId)
            removeFromQueue(playerId);
    });
    socket.on("register_player", (data) => {
        const playerId = data.playerId;
        const oldPlayerId = socketToPlayer.get(socket.id);
        if (oldPlayerId && oldPlayerId !== playerId) {
            console.log(`🔄 Identity transfer on socket ${socket.id}: ${oldPlayerId} -> ${playerId}`);
            const roomId = playerToRoom.get(oldPlayerId);
            if (roomId) {
                const game = games.get(roomId);
                if (game) {
                    if (game.players.white === oldPlayerId)
                        game.players.white = playerId;
                    if (game.players.black === oldPlayerId)
                        game.players.black = playerId;
                    playerToRoom.set(playerId, roomId);
                    playerToRoom.delete(oldPlayerId);
                }
            }
            const qIdx = searchQueue.indexOf(oldPlayerId);
            if (qIdx > -1)
                searchQueue[qIdx] = playerId;
        }
        const currentActiveSocket = playerToSocket.get(playerId);
        if (currentActiveSocket && currentActiveSocket !== socket.id) {
            socketToPlayer.delete(currentActiveSocket);
        }
        socketToPlayer.set(socket.id, playerId);
        playerToSocket.set(playerId, socket.id);
        console.log(`[Register] Player ${playerId} registered on socket ${socket.id}. Active games: ${games.size}`);
        const roomId = playerToRoom.get(playerId);
        if (roomId) {
            const game = games.get(roomId);
            if (game && game.status !== "ended") {
                socket.join(roomId);
                const color = game.getColorForPlayer(playerId);
                console.log(`[Rejoin] Found room ${roomId} for player ${playerId}. Color: ${color}`);
                socket.emit("rejoin_game", {
                    roomId,
                    color: color === "w" ? "white" : (color === "b" ? "black" : ""),
                    fen: game.board_fen,
                    status: game.status,
                    history: game.history,
                    chatMessages: game.chatMessages
                });
            }
        }
    });
    socket.on("offer_draw", () => {
        const playerId = socketToPlayer.get(socket.id);
        const roomId = playerId ? playerToRoom.get(playerId) : null;
        if (roomId)
            socket.to(roomId).emit("draw_offered", { from: playerId });
    });
    socket.on("accept_draw", () => {
        const playerId = socketToPlayer.get(socket.id);
        const roomId = playerId ? playerToRoom.get(playerId) : null;
        const game = roomId ? games.get(roomId) : null;
        if (game && game.status === "playing") {
            game.status = "ended";
            io.to(roomId).emit("game_ended", { reason: "Draw Accepted", result: "0", status: "ended" });
        }
    });
    socket.on("decline_draw", () => {
        const playerId = socketToPlayer.get(socket.id);
        const roomId = playerId ? playerToRoom.get(playerId) : null;
        if (roomId)
            socket.to(roomId).emit("draw_declined");
    });
    socket.on("request_fen", () => {
        const playerId = socketToPlayer.get(socket.id);
        const roomId = playerId ? playerToRoom.get(playerId) : null;
        const game = roomId ? games.get(roomId) : null;
        if (game)
            socket.emit("receive_fen", { board_fen: game.board_fen });
    });
    socket.on("request_history", () => {
        const playerId = socketToPlayer.get(socket.id);
        const roomId = playerId ? playerToRoom.get(playerId) : null;
        const game = roomId ? games.get(roomId) : null;
        if (game)
            socket.emit("receive_history", { history: game.history });
    });
    socket.on("request_game_status", (callback) => {
        const playerId = socketToPlayer.get(socket.id);
        const roomId = playerId ? playerToRoom.get(playerId) : null;
        const game = roomId ? games.get(roomId) : null;
        if (game)
            callback(game.status);
    });
    socket.on("create_room", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId)
            return;
        removeFromQueue(playerId);
        const game = new Game(playerId);
        games.set(game.roomId.toUpperCase(), game);
        playerToRoom.set(playerId, game.roomId);
        socket.join(game.roomId);
        socket.emit("room_created", { roomId: game.roomId, color: "white" });
    });
    socket.on("join_room", (data) => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId || !data.roomId) {
            socket.emit("error", { message: "Player not registered or no room ID provided" });
            return;
        }
        const roomId = data.roomId.trim().toUpperCase();
        const game = games.get(roomId);
        console.log(`[Join Room Request] Room: ${roomId}, Player: ${playerId}. Game found: ${!!game}`);
        if (!game) {
            console.log(`[Join Room] Room ${roomId} not found for player ${playerId}`);
            socket.emit("room_not_found", { roomId });
            return;
        }
        const existingColor = game.getColorForPlayer(playerId);
        if (existingColor) {
            console.log(`[Join Room] Player ${playerId} already in room ${roomId}. Sending rejoin.`);
            playerToRoom.set(playerId, roomId);
            socket.join(roomId);
            socket.emit("rejoin_game", {
                roomId,
                color: existingColor === "w" ? "white" : "black",
                fen: game.board_fen,
                status: game.status,
                history: game.history,
                chatMessages: game.chatMessages
            });
            return;
        }
        if (game.players.white && game.players.black) {
            console.log(`[Join Room] Room ${roomId} is full. Player ${playerId} joining as spectator.`);
            socket.join(roomId);
            socket.emit("rejoin_game", {
                roomId,
                color: "",
                fen: game.board_fen,
                status: game.status,
                history: game.history,
                chatMessages: game.chatMessages
            });
            return;
        }
        game.addPlayer(playerId);
        playerToRoom.set(playerId, roomId);
        socket.join(roomId);
        removeFromQueue(playerId);
        socket.emit("joined_room", { roomId, color: "black" });
        if (game.players.white && game.players.black) {
            game.status = "playing";
            io.to(roomId).emit("start_game", { roomId, fen: game.board_fen, status: "playing" });
        }
    });
    socket.on("move", (data) => {
        const playerId = socketToPlayer.get(socket.id);
        const roomId = playerId ? playerToRoom.get(playerId) : null;
        const game = roomId ? games.get(roomId) : null;
        if (!game || game.status !== "playing")
            return;
        const color = game.getColorForPlayer(playerId);
        if (!color)
            return;
        try {
            const chess = new Chess(game.board_fen);
            if (chess.turn() !== color)
                return;
            const piece = chess.get(data.from);
            const toRank = parseInt(data.to.match(/\d+/)?.[0] || "0", 10);
            const boardHeight = 8; // Default for chess.js, but prepared for future expansion
            const isPawnPromotion = piece && piece.type === "p" && ((piece.color === "w" && toRank === boardHeight) || (piece.color === "b" && toRank === 1));
            console.log(`[Move Request] Room: ${roomId}, Player: ${playerId}, Move: ${data.from}->${data.to}, Promotion: ${data.promotion}, IsPromo: ${isPawnPromotion}`);
            if (isPawnPromotion && !data.promotion) {
                console.log(`[Promotion Needed] Room: ${roomId}, Move: ${data.from}->${data.to}`);
                socket.emit("promotion_needed", { from: data.from, to: data.to });
                game.pendingMove = { from: data.from, to: data.to };
                return;
            }
            const moveResult = chess.move({ from: data.from, to: data.to, promotion: data.promotion });
            if (moveResult) {
                console.log(`[Move Accepted] Room: ${roomId}, SAN: ${moveResult.san}`);
                game.board_fen = chess.fen();
                game.history.push(moveResult.san);
                game.pendingMove = null; // Clear any pending promotion
                const status = checkGameStatus(game);
                io.to(roomId).emit("move", {
                    from: moveResult.from,
                    to: moveResult.to,
                    promotion: moveResult.promotion,
                    san: moveResult.san,
                    fen: game.board_fen,
                    gameStatus: game.status
                });
                if (game.status === "ended" && status) {
                    io.to(roomId).emit("game_ended", { reason: status.gameInfo, result: status.result, status: "ended" });
                }
            }
            else {
                console.warn(`[Move Rejected] Invalid move attempted in room ${roomId}: ${data.from}-${data.to}`);
                socket.emit("error", { message: "Invalid move" });
                socket.emit("receive_fen", { board_fen: game.board_fen }); // Resync client
            }
        }
        catch (err) {
            console.error(`[Move Error] Room ${roomId}:`, err);
            socket.emit("error", { message: "Legal move validation error" });
        }
    });
    socket.on("resign", () => {
        const playerId = socketToPlayer.get(socket.id);
        const roomId = playerId ? playerToRoom.get(playerId) : null;
        const game = roomId ? games.get(roomId) : null;
        if (game && game.status === "playing") {
            const myColor = game.getColorForPlayer(playerId);
            game.status = "ended";
            io.to(roomId).emit("game_ended", { reason: "Resigned", result: myColor === "w" ? "b" : "w", status: "ended" });
        }
    });
    socket.on("chat_message", (data) => {
        const playerId = socketToPlayer.get(socket.id);
        const roomId = playerId ? playerToRoom.get(playerId) : null;
        if (roomId) {
            const game = games.get(roomId);
            if (game)
                game.chatMessages.push({ message: data.message, playerId: playerId });
            io.to(roomId).emit("chat_message", { message: data.message, playerId });
        }
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
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    console.log(`📡 Local Network IP: http://${alias.address}:${PORT}`);
                }
            }
        }
    }
});
