"use client";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
  { autoConnect: true }
);

export { socket };

interface SocketComponentProps {
  myColor: "white" | "black" | null;
  gameStarted: boolean;
  gameEnded: boolean;
  currentRoom: string;
  onPlayerJoined: () => void;
}

export default function SocketComponent({
  myColor,
  gameStarted,
  gameEnded,
  currentRoom: propCurrentRoom,
  onPlayerJoined,
}: SocketComponentProps) {
  const [msg, setMsg] = useState("");
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [searchRoomKey, setSearchRoomKey] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [status, setStatus] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [drawOffered, setDrawOffered] = useState(false);
  const [opponentOfferedDraw, setOpponentOfferedDraw] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync with prop
  useEffect(() => {
    if (propCurrentRoom) {
      setCurrentRoom(propCurrentRoom);
    }
  }, [propCurrentRoom]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageHistory]);

  // Load saved state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRoom = sessionStorage.getItem("currentRoom");
      const savedGameEnded = sessionStorage.getItem("gameEnded");

      if (savedRoom) {
        setCurrentRoom(savedRoom);
      }
      if (savedGameEnded === "true") {
        setGameResult(sessionStorage.getItem("gameResult"));
      }
    }
  }, []);

  const createRoom = () => {
    socket.emit("create_room");
  };

  const searchRoom = () => {
    if (!searchRoomKey.trim()) {
      setStatus("Bitte Raum-Code eingeben!");
      return;
    }
    setStatus("Suche...");
    socket.emit("search_room", { roomKey: searchRoomKey.trim().toUpperCase() });
  };

  const joinRoom = (roomKey: string) => {
    socket.emit("join_room", { room: roomKey });
  };

  const sendMessage = () => {
    if (currentRoom && msg.trim()) {
      socket.emit("chat", { message: msg, room: currentRoom });
      setMessageHistory((prev) => [...prev, `Du: ${msg}`]);
      setMsg("");
    }
  };

  const offerDraw = () => {
    if (currentRoom && !gameEnded) {
      socket.emit("offer_draw", { room: currentRoom });
      setDrawOffered(true);
      setStatus("Remis-Angebot gesendet");
    }
  };

  const acceptDraw = () => {
    if (currentRoom) {
      socket.emit("accept_draw", { room: currentRoom });
      setGameResult("remis");
      setStatus("Remis akzeptiert! Spiel beendet.");
      setOpponentOfferedDraw(false);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem("gameResult", "remis");
      }
    }
  };

  const declineDraw = () => {
    if (currentRoom) {
      socket.emit("decline_draw", { room: currentRoom });
      setOpponentOfferedDraw(false);
      setStatus("Remis abgelehnt");
    }
  };

  const resign = () => {
    if (
      currentRoom &&
      !gameEnded &&
      confirm("Möchtest du wirklich aufgeben?")
    ) {
      socket.emit("resign", { room: currentRoom });
      setGameResult("verloren");
      setStatus("Du hast aufgegeben");

      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem("gameResult", "verloren");
      }
    }
  };

  useEffect(() => {
    socket.on("room_created", (data: any) => {
      setCurrentRoom(data.roomKey);
      setRoom(data.roomKey);
      setStatus(`Raum erstellt: ${data.roomKey}`);
      setPlayerCount(1);
      setGameResult(null);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("myColor", "white");
        sessionStorage.setItem("currentRoom", data.roomKey);
      }
    });

    socket.on("room_found", (data: any) => {
      setStatus(`Raum gefunden! ${data.playerCount}/2 Spieler`);
      if (!data.isFull) {
        joinRoom(data.roomKey);
      } else {
        setStatus("Raum ist voll!");
      }
    });

    socket.on("room_not_found", () => {
      setStatus("Raum nicht gefunden!");
    });

    socket.on("joined_room", (data: any) => {
      setCurrentRoom(data.roomKey);
      setRoom(data.roomKey);
      setStatus("Erfolgreich beigetreten!");
      setSearchRoomKey("");
      setPlayerCount(2); // Spielerzahl für den beitretenden Spieler aktualisieren
      setGameResult(null);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("myColor", "black");
        sessionStorage.setItem("currentRoom", data.roomKey);
      }
    });

    socket.on("player_joined", (data: any) => {
      setPlayerCount(data.playerCount);
      onPlayerJoined(); // Callback aufrufen, um gameStarted in Board.tsx zu setzen
      setStatus("Gegner ist beigetreten! Spiel kann starten.");
    });

    socket.on("player_left", () => {
      setStatus("Gegner hat das Spiel verlassen");
      setPlayerCount(1);
    });

    socket.on("receive_message", (data: any) => {
      setMessageHistory((prev) => [...prev, `Gegner: ${data.message}`]);
    });

    socket.on("offer_draw", () => {
      setOpponentOfferedDraw(true);
      setStatus("Gegner bietet Remis an!");
    });

    socket.on("draw_accepted", () => {
      setGameResult("remis");
      setStatus("Remis! Spiel beendet.");
      setDrawOffered(false);
      setOpponentOfferedDraw(false);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem("gameResult", "remis");
      }
    });

    socket.on("draw_declined", () => {
      setDrawOffered(false);
      setStatus("Gegner hat Remis abgelehnt");
    });

    socket.on("resign", () => {
      setGameResult("gewonnen");
      setStatus("Gegner hat aufgegeben! Du hast gewonnen!");

      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem("gameResult", "gewonnen");
      }
    });

    socket.on("game_ended", (data: any) => {
      if (data.status) {
        setStatus(data.status);
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
      }
    });

    socket.on("error", (data: any) => {
      setStatus(`Fehler: ${data.message}`);
    });

    return () => {
      socket.off("room_created");
      socket.off("room_found");
      socket.off("room_not_found");
      socket.off("joined_room");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("receive_message");
      socket.off("offer_draw");
      socket.off("draw_accepted");
      socket.off("draw_declined");
      socket.off("resign");
      socket.off("game_ended");
      socket.off("error");
    };
  }, [currentRoom]);

  // Show game actions for both players when game is active
  const showGameActions =
    currentRoom && gameStarted && !gameEnded && playerCount === 2;

  return (
    <div className="ml-4 mt-4 p-4 bg-gray-100 rounded-lg space-y-3 w-80 h-fit">
      <h2 className="font-bold text-lg">Schach Multiplayer</h2>

      <div
        className={`p-2 rounded text-sm font-semibold ${
          gameResult === "gewonnen"
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

      {gameEnded && gameResult && (
        <div
          className={`p-4 rounded-lg text-center border-4 ${
            gameResult === "gewonnen"
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
            />
            <button
              onClick={searchRoom}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 font-semibold"
            >
              Raum beitreten (Schwarz)
            </button>
          </div>
        </div>
      )}

      {showGameActions && (
        <div className="space-y-2 border-t pt-2">
          <h3 className="font-semibold text-sm">Spiel-Aktionen</h3>

          {opponentOfferedDraw ? (
            <div className="bg-yellow-100 p-3 rounded space-y-2 border-2 border-yellow-400">
              <p className="text-sm font-bold text-center">🤝 Remis-Angebot!</p>
              <div className="flex gap-2">
                <button
                  onClick={acceptDraw}
                  className="flex-1 bg-green-500 text-white p-2 rounded text-sm font-semibold hover:bg-green-600"
                >
                  ✓ Akzeptieren
                </button>
                <button
                  onClick={declineDraw}
                  className="flex-1 bg-red-500 text-white p-2 rounded text-sm font-semibold hover:bg-red-600"
                >
                  ✗ Ablehnen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={offerDraw}
              disabled={drawOffered}
              className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 disabled:bg-gray-400 font-semibold"
            >
              {drawOffered ? "⏳ Remis angeboten..." : "🤝 Remis anbieten"}
            </button>
          )}

          <button
            onClick={resign}
            className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 font-semibold"
          >
            🏳️ Aufgeben
          </button>
        </div>
      )}

      {currentRoom && (
        <div className="border-t pt-2 space-y-2">
          <h3 className="font-semibold text-sm">Chat</h3>

          <div className="bg-white p-2 rounded h-32 overflow-y-auto text-sm border">
            {messageHistory.length === 0 ? (
              <p className="text-gray-400 text-center mt-12">
                Keine Nachrichten
              </p>
            ) : (
              messageHistory.map((m, i) => (
                <div
                  key={i}
                  className={`mb-1 p-1 rounded ${
                    m.startsWith("Du:") ? "bg-blue-50 text-right" : "bg-gray-50"
                  }`}
                >
                  {m}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nachricht..."
              className="flex-1 p-2 rounded border text-sm"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600 font-semibold"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
