"use client";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const socket: Socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
  { autoConnect: true }
);

export { socket };

interface SocketComponentProps {
  myColor: "white" | "black" | null;
  gameStatus: "playing" | "ended" | "waiting" | "";
  currentRoom: string;
  onPlayerJoined: () => void;
  setGameStatus: any;
  gameInfo: string;
  setMyColor: any;
}

export default function SocketComponent({
  myColor,
  gameStatus,
  currentRoom: propCurrentRoom,
  onPlayerJoined,
  setGameStatus,
  gameInfo,
  setMyColor
}: SocketComponentProps) {
  const [msg, setMsg] = useState("");
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [searchRoomKey, setSearchRoomKey] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [status, setStatus] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Bei Component Mount:
  useEffect(() => {
    let playerId = localStorage.getItem("playerId");
    if (!playerId) {
      playerId = uuidv4(); // Neue ID generieren
      localStorage.setItem("playerId", playerId);
    }

    // Beim Server registrieren
    socket.emit("register_player", { playerId });

    // Beim Server registrieren
    socket.emit("register_player", { playerId });
  }, []);
  // Sync with prop
  useEffect(() => {
    if (propCurrentRoom) {
      setCurrentRoom(propCurrentRoom);
    }
  }, [propCurrentRoom]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageHistory]);

  // ---- Funktionen ----
  const createRoom = () => {
    socket.emit("create_room");
    setStatus("Erstelle Raum...");
  };

  const joinRoom = (roomId: string) => {
    if (!roomId.trim()) {
      setStatus("Bitte Raum-Code eingeben!");
      return;
    }
    console.log("JOIN ROOM FUNCTION CALLED:", roomId);
    setStatus("Trete Raum bei...");
    socket.emit("join_room", { roomId: roomId.trim().toUpperCase() });
  };

  const resign = () => {
    if (
      currentRoom &&
      gameStatus === "playing" &&
      confirm("Möchtest du wirklich aufgeben?")
    ) {
      // Der Server hat kein "resign" Event mehr
      // Stattdessen wird der Disconnect gehandhabt
      setGameResult("verloren");
      setStatus("Du hast aufgegeben");
      socket.disconnect();
      setTimeout(() => socket.connect(), 100);
    }
  };

  // ---- Socket Listener ----
  useEffect(() => {
    socket.on("room_created", (data: any) => {
      console.log("Room created:", data);
      setCurrentRoom(data.roomId);
      setStatus(`Raum erstellt: ${data.roomId}`);
      setPlayerCount(1);
      setGameResult(null);
    });

    socket.on("joined_room", (data: any) => {
      console.log("Joined room:", data);
      setCurrentRoom(data.roomId);
      setStatus("Erfolgreich beigetreten! Warte auf Spielstart...");
      setSearchRoomKey("");
      setPlayerCount(2);
      setGameResult(null);
    });

    socket.on("start_game", (data: any) => {
      console.log("Game started:", data);
      setMyColor(data.color);
      setStatus("Spiel gestartet!");
      setPlayerCount(2);
      onPlayerJoined();
    });

    socket.on("room_not_found", () => {
      setStatus("Raum nicht gefunden!");
      setPlayerCount(0);
    });

    socket.on("room_full", () => {
      setStatus("Raum ist bereits voll!");
    });

    socket.on("already_in_room", () => {
      setStatus("Du bist bereits in diesem Raum!");
    });

    socket.on("opp_disconnected", () => {
      setStatus("Gegner hat das Spiel verlassen");
      setPlayerCount(1);
      setGameResult("gewonnen");
      setGameStatus("ended");
    });

    socket.on("game_ended", (data: any) => {
      console.log("Game ended:", data);
      setStatus(data.reason || "Spiel beendet");
      setGameStatus("ended");

      // Bestimme Ergebnis basierend auf result
      if (data.result === "0") {
        setGameResult("remis");
      } else {
        // result ist "w" oder "b" - Gewinner
        const iWon = (data.result === "w" && myColor === "white") ||
          (data.result === "b" && myColor === "black");
        setGameResult(iWon ? "gewonnen" : "verloren");
      }
    });

    socket.on("error", (data: any) => {
      setStatus(`Fehler: ${data.message}`);
    });

    socket.on("illegal_move", (data: any) => {
      console.log("Illegal move:", data);
      const reasons: Record<string, string> = {
        not_in_room: "Du bist in keinem Raum!",
        room_not_found: "Raum nicht gefunden!",
        not_a_player: "Du bist kein Spieler in diesem Raum!",
        not_your_turn: "Du bist nicht am Zug!",
        illegal_move: "Unzulässiger Zug!",
        server_error: "Server-Fehler beim Zug",
        no_pending_move: "Kein ausstehender Zug",
        illegal_promotion_move: "Ungültige Bauernumwandlung"
      };
      setStatus(reasons[data.reason] || "Unzulässiger Zug!");
    });

    return () => {
      socket.off("room_created");
      socket.off("joined_room");
      socket.off("start_game");
      socket.off("room_not_found");
      socket.off("room_full");
      socket.off("already_in_room");
      socket.off("opp_disconnected");
      socket.off("game_ended");
      socket.off("error");
      socket.off("illegal_move");
    };
  }, [currentRoom, myColor, onPlayerJoined, setGameStatus]);

  const showGameActions =
    currentRoom && gameStatus === "playing" && playerCount === 2;

  return (
    <div className="ml-4 mt-4 p-4 bg-gray-100 rounded-lg space-y-3 w-80 h-fit">
      <h2 className="font-bold text-lg">Schach Multiplayer</h2>

      <div
        className={`p-2 rounded text-sm font-semibold ${gameResult === "gewonnen"
          ? "bg-green-200 text-green-800"
          : gameResult === "verloren"
            ? "bg-red-200 text-red-800"
            : gameResult === "remis"
              ? "bg-yellow-200 text-yellow-800"
              : "bg-blue-100 text-blue-800"
          }`}
      >
        {status || "Bereit"}
      </div>

      {gameStatus === "ended" && gameResult && (
        <div
          className={`p-4 rounded-lg text-center border-4 ${gameResult === "gewonnen"
            ? "bg-green-100 border-green-500 text-green-900"
            : gameResult === "verloren"
              ? "bg-red-100 border-red-500 text-red-900"
              : "bg-yellow-100 border-yellow-500 text-yellow-900"
            }`}
        >
          <div className="text-4xl mb-2">
            {gameResult === "gewonnen"
              ? "🏆"
              : gameResult === "verloren"
                ? "😢"
                : "🤝"}
          </div>
          <div className="text-xl font-bold">
            {gameResult === "gewonnen"
              ? "Du hast gewonnen!"
              : gameResult === "verloren"
                ? "Du hast verloren!"
                : "Remis!"}
          </div>
        </div>
      )}

      {currentRoom && (
        <div className="bg-green-100 p-2 rounded text-xs">
          <strong>Raum:</strong> {currentRoom}
          <br />
          <strong>Spieler:</strong> {playerCount}/2
          <br />
          <strong>Deine Farbe:</strong>{" "}
          {myColor === "white"
            ? "Weiß ⚪"
            : myColor === "black"
              ? "Schwarz ⚫"
              : "?"}
        </div>
      )}

      {!currentRoom && (
        <div className="space-y-2">
          <button
            onClick={createRoom}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 font-semibold"
          >
            Neues Spiel erstellen (Weiß)
          </button>

          <div className="space-y-1">
            <input
              value={searchRoomKey}
              onChange={(e) => setSearchRoomKey(e.target.value.toUpperCase())}
              placeholder="Raum-Code eingeben"
              className="w-full p-2 rounded border"
              onKeyDown={(e) => e.key === "Enter" && joinRoom(searchRoomKey)}
            />
            <button
              onClick={() => joinRoom(searchRoomKey)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 font-semibold"
            >
              Raum beitreten (Schwarz)
            </button>
          </div>
        </div>
      )}

      {showGameActions && gameStatus === "playing" && (
        <div className="space-y-2 border-t pt-2">
          <h3 className="font-semibold text-sm">Spiel-Aktionen</h3>

          <button
            onClick={resign}
            className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 font-semibold"
          >
            🏳️ Aufgeben
          </button>
        </div>
      )}

      {gameInfo && (
        <div className="mt-2 p-3 bg-yellow-100 border-2 border-yellow-400 rounded text-sm font-semibold text-center">
          {gameInfo}
        </div>
      )}
    </div>
  );
}