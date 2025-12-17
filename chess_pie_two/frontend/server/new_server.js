"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var cors_1 = require("cors");
var uuid_1 = require("uuid");
var chess_js_1 = require("chess.js");
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
var server = http_1.default.createServer(app);
var io = new socket_io_1.Server(server, {
    cors: {
        // origin: [
        //     "http://localhost:3000",
        //     "https://chessgamedev-l-ts-projects-95f31583.vercel.app",
        // ],
        origin: "*",
        methods: ["GET", "POST"],
    },
});
var checkGameStatus = function (game) {
    if (!game)
        return;
    var chess = new chess_js_1.Chess(game.board_fen);
    var gameInfo = "";
    var result = "0";
    if (chess.isCheckmate()) {
        var winner = chess.turn() === "w" ? "Schwarz" : "Weiß";
        gameInfo = "Schachmatt! ".concat(winner, " gewinnt!");
        result = chess.turn() === "w" ? "b" : "w";
        game.status = "ended";
        return { gameInfo: gameInfo, result: result };
    }
    if (chess.isStalemate()) {
        gameInfo = "Patt! Remis durch Patt.";
        game.status = "ended";
        return { gameInfo: gameInfo, result: "0" };
    }
    if (chess.isThreefoldRepetition()) {
        gameInfo = "Remis durch dreifache Stellungswiederholung.";
        game.status = "ended";
        return { gameInfo: gameInfo, result: "0" };
    }
    if (chess.isInsufficientMaterial()) {
        gameInfo = "Remis durch unzureichendes Material.";
        game.status = "ended";
        return { gameInfo: gameInfo, result: "0" };
    }
    var history = chess.history({ verbose: true });
    var halfmoveClock = 0;
    for (var i = history.length - 1; i >= 0; i--) {
        var move = history[i];
        if (move.captured || move.piece === "p") {
            break;
        }
        halfmoveClock++;
    }
    if (halfmoveClock >= 150) {
        gameInfo = "Remis durch 75-Züge-Regel.";
        game.status = "ended";
        return { gameInfo: gameInfo, result: "0" };
    }
    if (halfmoveClock >= 100) {
        gameInfo = "50-Züge-Regel erreicht! Remis kann beansprucht werden.";
    }
    else if (chess.isDraw()) {
        gameInfo = "Remis!";
        game.status = "ended";
        return { gameInfo: gameInfo, result: "0" };
    }
    else if (chess.isCheck()) {
        gameInfo = "Schach!";
    }
    else {
        gameInfo = "";
    }
    return false;
};
var Game = /** @class */ (function () {
    function Game(creatorPlayerId) {
        this.roomId = (0, uuid_1.v4)().substring(0, 8).trim().toUpperCase();
        this.players = { white: creatorPlayerId };
        this.status = "waiting";
        this.board_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        this.history = [];
        this.pendingMove = null;
    }
    Game.prototype.addPlayer = function (playerId) {
        if (!this.players.black) {
            this.players.black = playerId;
        }
    };
    Game.prototype.getColorForPlayer = function (playerId) {
        if (this.players.white === playerId)
            return "w";
        if (this.players.black === playerId)
            return "b";
        return null;
    };
    return Game;
}());
var games = new Map();
var playerToRoom = new Map();
var socketToPlayer = new Map();
io.on("connection", function (socket) {
    console.log("connected:", socket.id);
    socket.on("register_player", function (data) {
        var playerId = data.playerId;
        socketToPlayer.set(socket.id, playerId); // Diese Zeile ist schon da
        console.log("Player registered:", playerId, "Socket:", socket.id);
        // Wenn Spieler bereits in einem Raum war, rejoin
        var roomId = playerToRoom.get(playerId);
        if (roomId) {
            var game = games.get(roomId);
            if (game && game.status !== "ended") {
                socket.join(roomId); // Stelle sicher, dass der Socket dem Raum beitritt
                var color = game.getColorForPlayer(playerId);
                socket.emit("rejoin_game", {
                    roomId: roomId,
                    color: color === "w" ? "white" : "black",
                    fen: game.board_fen,
                    status: game.status
                });
                console.log("Player rejoined:", playerId, "Room:", roomId);
            }
        }
    });
    socket.on("request_fen", function () {
        var playerId = socketToPlayer.get(socket.id);
        if (!playerId)
            return;
        var roomId = playerToRoom.get(playerId);
        if (!roomId)
            return;
        var game = games.get(roomId);
        if (!game)
            return;
        socket.emit("receive_fen", { board_fen: game.board_fen });
    });
    socket.on("request_history", function () {
        var playerId = socketToPlayer.get(socket.id);
        if (!playerId)
            return;
        var roomId = playerToRoom.get(playerId);
        if (!roomId)
            return;
        var game = games.get(roomId);
        if (!game)
            return;
        socket.emit("receive_history", { history: game.history });
    });
    socket.on("request_game_status", function (callback) {
        var playerId = socketToPlayer.get(socket.id);
        if (!playerId)
            return;
        var roomId = playerToRoom.get(playerId);
        if (!roomId)
            return;
        var game = games.get(roomId);
        if (!game)
            return;
        callback(game.status);
    });
    socket.on("create_room", function () {
        var playerId = socketToPlayer.get(socket.id);
        if (!playerId) {
            socket.emit("error", { message: "Player not registered" });
            return;
        }
        console.log("Creating room for player:", playerId);
        var game = new Game(playerId);
        games.set(game.roomId.trim().toUpperCase(), game);
        playerToRoom.set(playerId, game.roomId);
        socket.join(game.roomId);
        socket.emit("room_created", { roomId: game.roomId, color: "white" });
    });
    socket.on("move", function (data) {
        var _a;
        try {
            var playerId = socketToPlayer.get(socket.id);
            if (!playerId) {
                socket.emit("illegal_move", { reason: "not_registered" });
                return;
            }
            var roomId = playerToRoom.get(playerId);
            if (!roomId) {
                console.log("❌ not_in_room - playerToRoom:", Array.from(playerToRoom.entries()));
                socket.emit("illegal_move", { reason: "not_in_room" });
                return;
            }
            var game = games.get(roomId);
            if (!game) {
                console.log("❌ room_not_found - games:", Array.from(games.keys()));
                socket.emit("illegal_move", { reason: "room_not_found" });
                return;
            }
            var color = game.getColorForPlayer(playerId);
            if (!color) {
                socket.emit("illegal_move", { reason: "not_a_player" });
                return;
            }
            var chess = new chess_js_1.Chess(game.board_fen);
            if (chess.turn() !== color) {
                socket.emit("illegal_move", { reason: "not_your_turn" });
                return;
            }
            var piece = chess.get(data.from);
            var toRank = parseInt(data.to[1]);
            var isPawnPromotion = piece && piece.type === "p" &&
                ((piece.color === "w" && toRank === 8) || (piece.color === "b" && toRank === 1));
            if (isPawnPromotion && !data.promotion) {
                socket.emit("promotion_needed", { from: data.from, to: data.to });
                game.pendingMove = { from: data.from, to: data.to };
                return;
            }
            var moveObj = { from: data.from, to: data.to };
            if (data.promotion)
                moveObj.promotion = data.promotion;
            var moveResult = chess.move(moveObj);
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
            var status_1 = checkGameStatus(game);
            io.to(roomId).emit("move", {
                from: moveResult.from,
                to: moveResult.to,
                promotion: (_a = moveResult.promotion) !== null && _a !== void 0 ? _a : null,
                san: moveResult.san,
                fen: game.board_fen,
                gameStatus: game.status,
            });
            if (game.status === "ended" && status_1) {
                io.to(roomId).emit("game_ended", {
                    reason: status_1.gameInfo,
                    result: status_1.result,
                    status: "ended"
                });
            }
        }
        catch (err) {
            console.error("Server move handler error:", err);
            socket.emit("illegal_move", { reason: "server_error" });
        }
    });
    // In deinem Server Code, ersetze den promotion_done Handler mit diesem:
    socket.on("promotion_done", function (data) {
        var playerId = socketToPlayer.get(socket.id);
        if (!playerId) {
            socket.emit("illegal_move", { reason: "not_registered" });
            return;
        }
        var roomId = playerToRoom.get(playerId);
        if (!roomId) {
            socket.emit("illegal_move", { reason: "not_in_room" });
            return;
        }
        var game = games.get(roomId);
        if (!game) {
            socket.emit("illegal_move", { reason: "room_not_found" });
            return;
        }
        var pendingMove = game.pendingMove;
        if (!pendingMove) {
            socket.emit("illegal_move", { reason: "no_pending_move" });
            return;
        }
        try {
            var chess = new chess_js_1.Chess(game.board_fen);
            var moveResult = chess.move({
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
            var status_2 = checkGameStatus(game);
            io.to(roomId).emit("move", {
                from: moveResult.from,
                to: moveResult.to,
                promotion: moveResult.promotion,
                san: moveResult.san,
                fen: game.board_fen,
                gameStatus: game.status,
            });
            if (game.status === "ended" && status_2) {
                io.to(roomId).emit("game_ended", {
                    reason: status_2.gameInfo,
                    result: status_2.result,
                    status: "ended"
                });
            }
        }
        catch (error) {
            console.error("Promotion error:", error);
            socket.emit("illegal_move", { reason: "illegal_promotion_move" });
        }
    });
    socket.on("disconnect", function () {
        var playerId = socketToPlayer.get(socket.id);
        if (!playerId)
            return;
        var roomId = playerToRoom.get(playerId);
        if (!roomId)
            return;
        var game = games.get(roomId);
        if (!game)
            return;
        // Benachrichtige andere Spieler
        socket.to(roomId).emit("opp_disconnected", { playerId: playerId });
        // NICHT den Spieler aus dem Spiel entfernen - nur Socket-Disconnect
        // Spieler kann sich wieder verbinden
        socketToPlayer.delete(socket.id);
        console.log("disconnected:", socket.id, "Player:", playerId);
    });
    socket.on("join_room", function (data) {
        console.log("Trying to join room:", data);
        var playerId = socketToPlayer.get(socket.id);
        if (!playerId) {
            socket.emit("error", { message: "Player not registered" });
            return;
        }
        if (!data.roomId) {
            socket.emit("room_not_found");
            return;
        }
        var roomId = data.roomId.trim().toUpperCase();
        var game = games.get(roomId);
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
        socket.emit("joined_room", { roomId: roomId, color: "black" });
        if (game.players.white && game.players.black) {
            game.status = "playing";
            console.log("White player:", game.players.white);
            console.log("Black player:", game.players.black);
            // Finde die Sockets für beide Spieler
            var whiteSockets = Array.from(socketToPlayer.entries())
                .filter(function (_a) {
                var _ = _a[0], pId = _a[1];
                return pId === game.players.white;
            })
                .map(function (_a) {
                var sId = _a[0], _ = _a[1];
                return sId;
            });
            var blackSockets = Array.from(socketToPlayer.entries())
                .filter(function (_a) {
                var _ = _a[0], pId = _a[1];
                return pId === game.players.black;
            })
                .map(function (_a) {
                var sId = _a[0], _ = _a[1];
                return sId;
            });
            whiteSockets.forEach(function (socketId) {
                io.to(socketId).emit("start_game", {
                    roomId: roomId,
                    fen: game.board_fen,
                    color: "white"
                });
            });
            blackSockets.forEach(function (socketId) {
                io.to(socketId).emit("start_game", {
                    roomId: roomId,
                    fen: game.board_fen,
                    color: "black"
                });
            });
            console.log("Game started in room:", roomId);
        }
    });
});
server.listen(3001, '0.0.0.0', function () {
    console.log("Server running on port 3001");
});
