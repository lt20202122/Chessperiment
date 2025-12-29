import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { Chess, type Square } from "chess.js";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // origin: [
        //     "http://localhost:3000",
        //     "https://chessgamedev-l-ts-projects-95f31583.vercel.app",

        // ],
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const checkGameStatus = (game: Game) => {
    if (!game) return;
    const chess = new Chess(game.board_fen);
    let gameInfo: string = "";
    let result: string = "0";

    if (chess.isCheckmate()) {
        const winner = chess.turn() === "w" ? "Schwarz" : "Weiß";
        gameInfo = `Schachmatt! ${winner} gewinnt!`
        result = chess.turn() === "w" ? "b" : "w";
        game.status = "ended";
        return { gameInfo, result };
    }

    if (chess.isStalemate()) {
        gameInfo = "Patt! Remis durch Patt.";
        game.status = "ended";
        return { gameInfo, result: "0" };
    }

    if (chess.isThreefoldRepetition()) {
        gameInfo = "Remis durch dreifache Stellungswiederholung.";
        game.status = "ended";
        return { gameInfo, result: "0" };
    }

    if (chess.isInsufficientMaterial()) {
        gameInfo = "Remis durch unzureichendes Material.";
        game.status = "ended";
        return { gameInfo, result: "0" };
    }

    const history = chess.history({ verbose: true });
    let halfmoveClock = 0;

    for (let i = history.length - 1; i >= 0; i--) {
        const move = history[i];
        if (move.captured || move.piece === "p") {
            break;
        }
        halfmoveClock++;
    }

    if (halfmoveClock >= 150) {
        gameInfo = "Remis durch 75-Züge-Regel.";
        game.status = "ended";
        return { gameInfo, result: "0" };
    }

    if (halfmoveClock >= 100) {
        gameInfo = "50-Züge-Regel erreicht! Remis kann beansprucht werden."
    } else if (chess.isDraw()) {
        gameInfo = "Remis!";
        game.status = "ended"
        return { gameInfo, result: "0" };
    } else if (chess.isCheck()) {
        gameInfo = "Schach!";
    } else {
        gameInfo = "";
    }

    return false;
};

class Game {
    roomId: string;
    players: {
        white?: string;
        black?: string;
    }
    status: "waiting" | "playing" | "ended";
    board_fen: string;
    history: string[];
    pendingMove: { to: Square, from: Square } | null;

    constructor(creatorPlayerId: string) {
        this.roomId = uuidv4().substring(0, 8).trim().toUpperCase();
        this.players = { white: creatorPlayerId };
        this.status = "waiting";
        this.board_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        this.history = [] as string[];
        this.pendingMove = null;
    }

    addPlayer(playerId: string) {
        if (!this.players.black) {
            this.players.black = playerId;
        }
    }

    getColorForPlayer(playerId: string): "w" | "b" | null {
        if (this.players.white === playerId) return "w";
        if (this.players.black === playerId) return "b";
        return null;
    }
}

const games = new Map<string, Game>();
const playerToRoom = new Map<string, string>();
const socketToPlayer = new Map<string, string>();
const searchQueue: string[] = [];

io.on("connection", (socket: Socket) => {
    console.log("connected:", socket.id);

    socket.on("quick_search", () => {
        console.log("Quick search requested");
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;

        console.log("Player entered quick search:", playerId);

        // Avoid duplicates in queue
        if (searchQueue.includes(playerId)) return;

        searchQueue.push(playerId);
        socket.emit("quick_search_started");

        if (searchQueue.length >= 2) {
            const p1 = searchQueue.shift()!;
            const p2 = searchQueue.shift()!;

            console.log("Matching players:", p1, "and", p2);

            const game = new Game(p1);
            game.addPlayer(p2);
            game.status = "playing";

            games.set(game.roomId, game);
            playerToRoom.set(p1, game.roomId);
            playerToRoom.set(p2, game.roomId);

            // Notify both players
            const socketsP1 = Array.from(socketToPlayer.entries()).filter(([_, id]) => id === p1).map(([sid]) => sid);
            const socketsP2 = Array.from(socketToPlayer.entries()).filter(([_, id]) => id === p2).map(([sid]) => sid);

            // Randomize colors
            const p1IsWhite = Math.random() > 0.5;
            if (!p1IsWhite) {
                // Swap roles in game object if needed, or just emit correctly
                game.players.white = p2;
                game.players.black = p1;
            }

            socketsP1.forEach(sid => {
                const s = io.sockets.sockets.get(sid);
                if (s) s.join(game.roomId);
                io.to(sid).emit("start_game", { roomId: game.roomId, color: p1IsWhite ? "white" : "black", fen: game.board_fen });
            });

            socketsP2.forEach(sid => {
                const s = io.sockets.sockets.get(sid);
                if (s) s.join(game.roomId);
                io.to(sid).emit("start_game", { roomId: game.roomId, color: p1IsWhite ? "black" : "white", fen: game.board_fen });
            });
        }
    });

    socket.on("cancel_search", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;
        const index = searchQueue.indexOf(playerId);
        if (index > -1) {
            searchQueue.splice(index, 1);
            socket.emit("search_cancelled");
        }
    });

    socket.on("register_player", (data: { playerId: string }) => {
        const playerId = data.playerId;
        socketToPlayer.set(socket.id, playerId);  // Diese Zeile ist schon da
        console.log("Player registered:", playerId, "Socket:", socket.id);

        // Wenn Spieler bereits in einem Raum war, rejoin
        const roomId = playerToRoom.get(playerId);
        if (roomId) {
            const game = games.get(roomId);
            if (game && game.status !== "ended") {
                socket.join(roomId);  // Stelle sicher, dass der Socket dem Raum beitritt
                const color = game.getColorForPlayer(playerId);

                if (!color) {
                    console.log("⚠️ Rejoin Warning: Player", playerId, "is in room", roomId, "but not in game players:", game.players);
                }

                socket.emit("rejoin_game", {
                    roomId,
                    color: color === "w" ? "white" : (color === "b" ? "black" : null),
                    fen: game.board_fen,
                    status: game.status,
                    history: game.history
                });
                console.log("Player rejoined:", playerId, "Room:", roomId);
            }
        }
    });

    socket.on("request_fen", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;
        const roomId = playerToRoom.get(playerId);
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game) return;
        socket.emit("receive_fen", { board_fen: game.board_fen });
    });

    socket.on("request_history", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;
        const roomId = playerToRoom.get(playerId);
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game) return;
        socket.emit("receive_history", { history: game.history });
    });

    socket.on("request_game_status", (callback) => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;
        const roomId = playerToRoom.get(playerId);
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game) return;
        callback(game.status);
    });

    socket.on("create_room", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) {
            socket.emit("error", { message: "Player not registered" });
            return;
        }

        console.log("Creating room for player:", playerId);
        const game = new Game(playerId);

        games.set(game.roomId.trim().toUpperCase(), game);
        playerToRoom.set(playerId, game.roomId);
        socket.join(game.roomId);

        socket.emit("room_created", { roomId: game.roomId, color: "white" });
    });

    socket.on("move", (data: { from: string; to: string; promotion?: string }) => {
        try {
            const playerId = socketToPlayer.get(socket.id);
            if (!playerId) {
                socket.emit("illegal_move", { reason: "not_registered" });
                return;
            }

            const roomId = playerToRoom.get(playerId);
            if (!roomId) {
                console.log("❌ not_in_room - playerToRoom:", Array.from(playerToRoom.entries()));
                socket.emit("illegal_move", { reason: "not_in_room" });
                return;
            }

            const game = games.get(roomId);
            if (!game) {
                console.log("❌ room_not_found - games:", Array.from(games.keys()));
                socket.emit("illegal_move", { reason: "room_not_found" });
                return;
            }

            const color = game.getColorForPlayer(playerId);
            if (!color) {
                socket.emit("illegal_move", { reason: "not_a_player" });
                return;
            }

            const chess = new Chess(game.board_fen);

            if (chess.turn() !== color) {
                socket.emit("illegal_move", { reason: "not_your_turn" });
                return;
            }

            const piece = chess.get(data.from as Square);
            const toRank = parseInt(data.to[1]);
            const isPawnPromotion =
                piece && piece.type === "p" &&
                ((piece.color === "w" && toRank === 8) || (piece.color === "b" && toRank === 1));

            if (isPawnPromotion && !data.promotion) {
                socket.emit("promotion_needed", { from: data.from, to: data.to });
                game.pendingMove = { from: data.from as Square, to: data.to as Square };
                return;
            }

            const moveObj: any = { from: data.from, to: data.to };
            if (data.promotion) moveObj.promotion = data.promotion;

            const moveResult = chess.move(moveObj);
            if (!moveResult) {
                socket.emit("illegal_move", {
                    reason: "illegal_move",
                    from: data.from,
                    to: data.to
                });
                return;
            }

            game.board_fen = chess.fen();
            game.history.push(moveResult.san);

            const status = checkGameStatus(game);

            io.to(roomId).emit("move", {
                from: moveResult.from,
                to: moveResult.to,
                promotion: moveResult.promotion ?? null,
                san: moveResult.san,
                fen: game.board_fen,
                gameStatus: game.status,
            });

            if (game.status === "ended" && status) {
                io.to(roomId).emit("game_ended", {
                    reason: status.gameInfo,
                    result: status.result,
                    status: "ended"
                });
            }
        } catch (err) {
            console.error("Server move handler error:", err);
            socket.emit("illegal_move", { reason: "server_error" });
        }
    });

    // In deinem Server Code, ersetze den promotion_done Handler mit diesem:

    socket.on("promotion_done", (data: { promotion: string }) => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) {
            socket.emit("illegal_move", { reason: "not_registered" });
            return;
        }

        const roomId = playerToRoom.get(playerId);
        if (!roomId) {
            socket.emit("illegal_move", { reason: "not_in_room" });
            return;
        }

        const game = games.get(roomId);
        if (!game) {
            socket.emit("illegal_move", { reason: "room_not_found" });
            return;
        }

        const pendingMove = game.pendingMove;
        if (!pendingMove) {
            socket.emit("illegal_move", { reason: "no_pending_move" });
            return;
        }

        try {
            const chess = new Chess(game.board_fen);
            const moveResult = chess.move({
                from: pendingMove.from,
                to: pendingMove.to,
                promotion: data.promotion,
            });

            if (!moveResult) {
                socket.emit("illegal_move", { reason: "illegal_promotion_move" });
                return;
            }

            game.board_fen = chess.fen();
            game.history.push(moveResult.san);
            game.pendingMove = null;

            const status = checkGameStatus(game);

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
                    status: "ended"
                });
            }
        } catch (error) {
            console.error("Promotion error:", error);
            socket.emit("illegal_move", { reason: "illegal_promotion_move" });
        }
    });

    socket.on("disconnect", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;

        const roomId = playerToRoom.get(playerId);
        if (!roomId) return;

        const game = games.get(roomId);
        if (!game) return;

        // Benachrichtige andere Spieler - NICHT das Spiel beenden
        // socket.to(roomId).emit("opp_disconnected", { playerId });

        // NICHT den Spieler aus dem Spiel entfernen - nur Socket-Disconnect
        // Spieler kann sich wieder verbinden
        socketToPlayer.delete(socket.id);

        console.log("disconnected:", socket.id, "Player:", playerId);
    });

    socket.on("join_room", (data) => {
        console.log("Trying to join room:", data);

        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) {
            socket.emit("error", { message: "Player not registered" });
            return;
        }

        if (!data.roomId) {
            socket.emit("room_not_found");
            return;
        }

        const roomId = data.roomId.trim().toUpperCase();
        const game = games.get(roomId);

        if (!game) {
            console.log("Room not found:", roomId, "Available:", Array.from(games.keys()));
            socket.emit("room_not_found");
            return;
        }

        if (game.players.white && game.players.black) {
            socket.emit("room_full");
            return;
        }

        if (game.players.white === playerId || game.players.black === playerId) {
            socket.emit("already_in_room");
            return;
        }

        game.addPlayer(playerId);
        playerToRoom.set(playerId, roomId);
        socket.join(roomId);

        console.log("Player joined:", playerId, "as black");

        socket.emit("joined_room", { roomId, color: "black" });

        if (game.players.white && game.players.black) {
            game.status = "playing";
            console.log("White player:", game.players.white);
            console.log("Black player:", game.players.black);

            // Finde die Sockets für beide Spieler
            const whiteSockets = Array.from(socketToPlayer.entries())
                .filter(([_, pId]) => pId === game.players.white)
                .map(([sId, _]) => sId);
            const blackSockets = Array.from(socketToPlayer.entries())
                .filter(([_, pId]) => pId === game.players.black)
                .map(([sId, _]) => sId);

            whiteSockets.forEach(socketId => {
                io.to(socketId).emit("start_game", {
                    roomId,
                    fen: game.board_fen,
                    color: "white"
                });
            });

            blackSockets.forEach(socketId => {
                io.to(socketId).emit("start_game", {
                    roomId,
                    fen: game.board_fen,
                    color: "black"
                });
            });

            console.log("Game started in room:", roomId);
        }
    });
    socket.on("resign", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;
        const roomId = playerToRoom.get(playerId);
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game || game.status !== "playing") return;

        const myColor = game.getColorForPlayer(playerId);
        if (!myColor) return;

        game.status = "ended";
        // If I resign, opponent wins
        const result = myColor === "w" ? "b" : "w";

        io.to(roomId).emit("game_ended", {
            reason: "Gegner hat aufgegeben",
            result: result,
            status: "ended"
        });
    });

    socket.on("offer_draw", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;
        const roomId = playerToRoom.get(playerId);
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game || game.status !== "playing") return;

        // Send ONLY to opponent
        socket.to(roomId).emit("draw_offered", { from: playerId });
    });

    socket.on("accept_draw", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;
        const roomId = playerToRoom.get(playerId);
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game || game.status !== "playing") return;

        game.status = "ended";

        io.to(roomId).emit("game_ended", {
            reason: "Remis vereinbart",
            result: "0",
            status: "ended"
        });
    });

    socket.on("reset_game", () => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;

        const roomId = playerToRoom.get(playerId);
        if (roomId) {
            console.log("♻️ Deleting room:", roomId, "requested by player:", playerId);

            // Notify others in room
            socket.to(roomId).emit("game_ended", {
                reason: "Das Spiel wurde vom Host zurückgesetzt.",
                status: "ended"
            });

            // Cleanup
            const game = games.get(roomId);
            if (game) {
                if (game.players.white) playerToRoom.delete(game.players.white);
                if (game.players.black) playerToRoom.delete(game.players.black);
                games.delete(roomId);
            }
        }
    });

    socket.on("chat_message", (data: { message: string }) => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;

        const roomId = playerToRoom.get(playerId);
        if (!roomId) return;

        console.log("Chat Message in room", roomId, ":", data.message);

        // Broadcast to everyone in the room
        io.to(roomId).emit("chat_message", {
            message: data.message,
            playerId: playerId
        });
    });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT as number, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
});