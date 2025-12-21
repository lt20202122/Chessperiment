"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";

const socket: Socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://192.168.178.48:3001",
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
  const t = useTranslations('Multiplayer');
  const [msg, setMsg] = useState("");
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [searchRoomKey, setSearchRoomKey] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [status, setStatus] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [drawOfferedByOpponent, setDrawOfferedByOpponent] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Bei Component Mount:
  useEffect(() => {
    // Use session ID if logged in, otherwise use localStorage
    let playerId: string;

    if (session?.user?.id) {
      // User is logged in - use their session ID
      playerId = session.user.id;
      console.log("🔐 Using authenticated user ID:", playerId);
    } else {
      // User is not logged in - use localStorage
      let storedId = localStorage.getItem("playerId");
      if (!storedId) {
        storedId = uuidv4(); // Generate new ID
        localStorage.setItem("playerId", storedId);
      }
      playerId = storedId;
      console.log("👤 Using guest ID:", playerId);
    }

    // Register with server
    socket.emit("register_player", { playerId });
  }, [session?.user?.id]); // Re-register when session changes
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
    setStatus(t('creatingRoom'));
  };

  const joinRoom = (roomId: string) => {
    if (!roomId.trim()) {
      setStatus(t('enterCode'));
      return;
    }
    console.log("JOIN ROOM FUNCTION CALLED:", roomId);
    setStatus(t('joiningRoom'));
    socket.emit("join_room", { roomId: roomId.trim().toUpperCase() });
  };

  const resign = () => {
    if (
      currentRoom &&
      gameStatus === "playing" &&
      confirm(t('confirmResign'))
    ) {
      socket.emit("resign");
    }
  };

  const offerDraw = () => {
    if (currentRoom && gameStatus === "playing") {
      socket.emit("offer_draw");
      setStatus(t('drawOffered')); // This setStatus might be redundant if server emits it back
    }
  };

  const acceptDraw = () => {
    if (currentRoom && gameStatus === "playing") {
      socket.emit("accept_draw");
    }
  };

  // ---- Socket Listener ----
  useEffect(() => {
    socket.on("room_created", (data: any) => {
      console.log("Room created:", data);
      setCurrentRoom(data.roomId);
      setStatus(`${t('roomCreated')}${data.roomId}`);
      setPlayerCount(1);
      setGameResult(null);
    });

    socket.on("joined_room", (data: any) => {
      console.log("Joined room:", data);
      setCurrentRoom(data.roomId);
      setStatus(t('joinedRoom'));
      setSearchRoomKey("");
      setPlayerCount(2);
      setGameResult(null);
    });

    socket.on("start_game", (data: any) => {
      console.log("Game started:", data);
      setMyColor(data.color);
      setStatus(t('gameStarted'));
      setPlayerCount(2);
      onPlayerJoined();
    });

    socket.on("room_not_found", () => {
      setStatus(t('roomNotFound'));
      setPlayerCount(0);
    });

    socket.on("room_full", () => {
      setStatus("Raum ist bereits voll!");
    });

    socket.on("already_in_room", () => {
      setStatus("Du bist bereits in diesem Raum!");
    });

    socket.on("opp_disconnected", () => {
      setStatus(t('opponentDisconnected'));
      setPlayerCount(1);
    });

    socket.on("draw_offered", () => {
      setDrawOfferedByOpponent(true);
      setStatus(t('drawOffered'));
    });

    socket.on("game_ended", async (data: any) => {
      console.log("Game ended:", data);
      setStatus(data.reason || t('gameEnded'));
      setGameStatus("ended");
      setDrawOfferedByOpponent(false);

      // Bestimme Ergebnis basierend auf result
      let result: "win" | "loss" | "draw";
      if (data.result === "0") {
        setGameResult("remis");
        result = "draw";
      } else {
        // result ist "w" oder "b" - Gewinner
        const iWon = (data.result === "w" && myColor === "white") ||
          (data.result === "b" && myColor === "black");
        setGameResult(iWon ? "gewonnen" : "verloren");
        result = iWon ? "win" : "loss";
      }

      // Save game result to Firestore if user is logged in
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/game-result", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              result,
              roomId: currentRoom,
              timestamp: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            console.error("Failed to save game result");
          }
        } catch (error) {
          console.error("Error saving game result:", error);
        }
      }
    });

    socket.on("error", (data: any) => {
      setStatus(`${t('error')}${data.message}`);
    });

    socket.on("illegal_move", (data: any) => {
      console.log("Illegal move:", data);
      const reasons: Record<string, string> = {
        not_in_room: t('reasons.not_in_room'),
        room_not_found: t('reasons.room_not_found'),
        not_a_player: t('reasons.not_a_player'),
        not_your_turn: t('reasons.not_your_turn'),
        illegal_move: t('reasons.illegal_move'),
        server_error: t('reasons.server_error'),
        no_pending_move: t('reasons.no_pending_move'),
        illegal_promotion_move: t('reasons.illegal_promotion_move')
      };
      setStatus(reasons[data.reason] || t('reasons.illegal_move'));
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
      socket.off("draw_offered");
    };
  }, [currentRoom, myColor, onPlayerJoined, setGameStatus]);

  const showGameActions =
    currentRoom && gameStatus === "playing" && playerCount === 2;

  return (
    <div className="lg:ml-4 mt-4 p-4 bg-gray-100 text-gray-800 rounded-lg space-y-3 w-full max-w-[90vw] lg:w-80 h-fit">
      <h2 className="font-bold text-lg">{t.rich('title')}</h2>

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
        {status || t('ready')}
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
              ? t('won')
              : gameResult === "verloren"
                ? t('lost')
                : t('draw')}
          </div>
        </div>
      )}

      {currentRoom && (
        <div className="bg-green-100 p-2 rounded text-xs">
          <strong>{t('roomLabel')}</strong> {currentRoom}
          <br />
          <strong>{t('playersLabel')}</strong> {playerCount}/2
          <br />
          <strong>{t('colorLabel')}</strong>{" "}
          {myColor === "white"
            ? `${t("white")} ⚪`
            : myColor === "black"
              ? `${t("black")} ⚫`
              : "?"}
        </div>
      )}

      {!currentRoom && (
        <div className="space-y-2">
          <button
            onClick={createRoom}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 font-semibold"
          >
            {t('createRoom')}
          </button>

          <div className="space-y-1">
            <input
              value={searchRoomKey}
              onChange={(e) => setSearchRoomKey(e.target.value.toUpperCase())}
              placeholder={t('enterCode')}
              className="w-full p-2 rounded border"
              onKeyDown={(e) => e.key === "Enter" && joinRoom(searchRoomKey)}
            />
            <button
              onClick={() => joinRoom(searchRoomKey)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 font-semibold"
            >
              {t('joinRoom')}
            </button>
          </div>
        </div>
      )}

      {showGameActions && gameStatus === "playing" && (
        <div className="space-y-2 border-t pt-2">
          <h3 className="font-semibold text-sm">{t('actions')}</h3>

          {drawOfferedByOpponent && (
            <div className="p-2 bg-blue-100 text-blue-800 text-xs font-bold rounded animate-pulse">
              🔵 {t('drawOffered')}
            </div>
          )}

          <div className="flex gap-2">
            {!drawOfferedByOpponent ? (
              <button
                onClick={offerDraw}
                className="flex-1 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 font-semibold text-sm"
              >
                🤝 {t('offerDraw')}
              </button>
            ) : (
              <button
                onClick={acceptDraw}
                className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600 font-semibold text-sm"
              >
                ✅ {t('acceptDraw')}
              </button>
            )}

            <button
              onClick={resign}
              className="flex-1 bg-red-500 text-white p-2 rounded hover:bg-red-600 font-semibold text-sm"
            >
              🏳️ {t('resign')}
            </button>
          </div>
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