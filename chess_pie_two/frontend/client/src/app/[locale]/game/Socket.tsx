"use client";
import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io.connect(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
);

// Socket exportieren für Board.tsx
export { socket };

export default function Socket() {
  const [msg, setMsg] = useState("");
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [searchRoomKey, setSearchRoomKey] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [status, setStatus] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [drawOffered, setDrawOffered] = useState(false);
  const [opponentOfferedDraw, setOpponentOfferedDraw] = useState(false);
  const [myColor, setMyColor] = useState<"white" | "black" | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);

  // Raum erstellen
  const createRoom = () => {
    socket.emit("create_room");
  };

  // Raum suchen
  const searchRoom = () => {
    if (!searchRoomKey.trim()) {
      setStatus("Bitte Raum-Code eingeben!");
      return;
    }
    setStatus("Suche...");
    socket.emit("search_room", { roomKey: searchRoomKey.trim().toUpperCase() });
  };

  // Raum beitreten
  const joinRoom = (roomKey: string) => {
    socket.emit("join_room", { room: roomKey });
  };

  // Nachricht senden
  const sendMessage = () => {
    if (currentRoom && msg.trim()) {
      socket.emit("chat", { message: msg, room: currentRoom });
      setMessageHistory((prev) => [...prev, `Du: ${msg}`]);
      setMsg("");
    }
  };

  // Remis anbieten
  const offerDraw = () => {
    if (currentRoom && !gameEnded) {
      socket.emit("offer_draw", { room: currentRoom });
      setDrawOffered(true);
      setStatus("Remis-Angebot gesendet");
    }
  };

  // Remis akzeptieren
  const acceptDraw = () => {
    if (currentRoom) {
      socket.emit("accept_draw", { room: currentRoom });
      setGameEnded(true);
      setGameResult("remis");
      setStatus("Remis akzeptiert! Spiel beendet.");
      setOpponentOfferedDraw(false);

      if (typeof window !== "undefined") {
        localStorage.setItem("gameEnded", "true");
      }
    }
  };

  // Remis ablehnen
  const declineDraw = () => {
    if (currentRoom) {
      socket.emit("decline_draw", { room: currentRoom });
      setOpponentOfferedDraw(false);
      setStatus("Remis abgelehnt");
    }
  };

  // Aufgeben
  const resign = () => {
    if (
      currentRoom &&
      !gameEnded &&
      confirm("Möchtest du wirklich aufgeben?")
    ) {
      socket.emit("resign", { room: currentRoom });
      setGameEnded(true);
      setGameResult("verloren");
      setStatus("Du hast aufgegeben");

      if (typeof window !== "undefined") {
        localStorage.setItem("gameEnded", "true");
      }
    }
  };

  useEffect(() => {
    // Raum erstellt - Spieler 1 ist WEISS
    socket.on("room_created", (data: any) => {
      setCurrentRoom(data.roomKey);
      setRoom(data.roomKey);
      setStatus(`Raum erstellt: ${data.roomKey}`);
      setPlayerCount(1);
      setMyColor("white");
      setGameEnded(false);
      setGameResult(null);

      if (typeof window !== "undefined") {
        localStorage.setItem("myColor", "white");
        console.log("SET OWN COLOR TO WHITE IN SOCKET.TSX");
        localStorage.setItem("currentRoom", data.roomKey);
      }
    });

    // Raum gefunden
    socket.on("room_found", (data: any) => {
      setStatus(`Raum gefunden! ${data.playerCount}/2 Spieler`);
      if (!data.isFull) {
        joinRoom(data.roomKey);
      } else {
        setStatus("Raum ist voll!");
      }
    });

    // Raum nicht gefunden
    socket.on("room_not_found", () => {
      setStatus("Raum nicht gefunden!");
    });

    // Erfolgreich beigetreten - Spieler 2 ist SCHWARZ
    socket.on("joined_room", (data: any) => {
      setCurrentRoom(data.roomKey);
      setRoom(data.roomKey);
      setStatus("Erfolgreich beigetreten!");
      setSearchRoomKey("");
      setMyColor("black");
      console.log("SET OWN COLOR TO BLACK IN SOCKET.TSX");
      setGameEnded(false);
      setGameResult(null);

      if (typeof window !== "undefined") {
        localStorage.setItem("myColor", "black");
        localStorage.setItem("currentRoom", data.roomKey);
      }
    });

    // Spieler beigetreten
    socket.on("player_joined", (data: any) => {
      setPlayerCount(data.playerCount);
      setStatus("Gegner ist beigetreten! Spiel kann starten.");
    });

    // Spieler verlassen
    socket.on("player_left", () => {
      setStatus("Gegner hat das Spiel verlassen");
      setPlayerCount(1);
    });

    // Chat-Nachricht empfangen
    socket.on("receive_message", (data: any) => {
      setMessageHistory((prev) => [...prev, `Gegner: ${data.message}`]);
    });

    // Remis-Angebot empfangen
    socket.on("offer_draw", () => {
      setOpponentOfferedDraw(true);
      setStatus("Gegner bietet Remis an!");
    });

    // Remis akzeptiert
    socket.on("draw_accepted", () => {
      setGameEnded(true);
      setGameResult("remis");
      setStatus("Remis! Spiel beendet.");
      setDrawOffered(false);
      setOpponentOfferedDraw(false);

      if (typeof window !== "undefined") {
        localStorage.setItem("gameEnded", "true");
      }
    });

    // Remis abgelehnt
    socket.on("draw_declined", () => {
      setDrawOffered(false);
      setStatus("Gegner hat Remis abgelehnt");
    });

    // Gegner hat aufgegeben
    socket.on("resign", () => {
      setGameEnded(true);
      setGameResult("gewonnen");
      setStatus("Gegner hat aufgegeben! Du hast gewonnen!");

      if (typeof window !== "undefined") {
        localStorage.setItem("gameEnded", "true");
      }
    });

    // Fehler
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
      socket.off("error");
    };
  }, [currentRoom]);

  return (
    <div className="ml-4 mt-4 p-4 bg-gray-100 rounded-lg space-y-3 w-80 h-fit">
      <h2 className="font-bold text-lg">Schach Multiplayer</h2>

      {/* Status */}
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

      {/* Spiel-Ergebnis */}
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

      {/* Raum Info */}
      {currentRoom && (
        <div className="bg-green-100 p-2 rounded text-xs">
          <strong>Raum:</strong> {currentRoom}
          <br />
          <strong>Spieler:</strong> {playerCount}/2
          <br />
          <strong>Deine Farbe:</strong>{" "}
          {myColor === "white" ? "Weiß ⚪" : "Schwarz ⚫"}
        </div>
      )}

      {/* Raum erstellen/suchen */}
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

      {/* Spiel-Aktionen */}
      {currentRoom && playerCount === 2 && !gameEnded && (
        <div className="space-y-2 border-t pt-2">
          <h3 className="font-semibold text-sm">Spiel-Aktionen</h3>

          {/* Remis */}
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

          {/* Aufgeben */}
          <button
            onClick={resign}
            className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 font-semibold"
          >
            🏳️ Aufgeben
          </button>
        </div>
      )}

      {/* Chat */}
      {currentRoom && (
        <div className="border-t pt-2 space-y-2">
          <h3 className="font-semibold text-sm">Chat</h3>

          {/* Nachrichten */}
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
          </div>

          {/* Eingabe */}
          <div className="flex gap-2">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
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
