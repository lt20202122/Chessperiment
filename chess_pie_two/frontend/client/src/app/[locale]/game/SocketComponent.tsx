"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSocket } from "@/context/SocketContext";
// Removed uuid import

const generateId = () => Math.random().toString(36).substring(2, 15);

// Initialize socket outside component to maintain connection
const socket = useSocket()


interface SocketComponentProps {
  myColor: "white" | "black" | null;
  gameStatus: "playing" | "ended" | "waiting" | "";
  currentRoom: string;
  onPlayerJoined: () => void;
  setGameStatus: (status: "playing" | "ended" | "waiting" | "") => void;
  setMyColor: (color: "white" | "black" | null) => void;

  // State lifted to parent
  onChatMessage: (msg: string) => void;
  onRoomInfo: (info: { playerCount: number, room: string }) => void;
  onGameInfo: (info: string) => void;
  onGameResult: (result: 'win' | 'loss' | 'draw' | null) => void;
  onSearchStarted?: () => void;
  onSearchCancelled?: () => void;

  // Triggers from parent (optional, could also use direct socket calls in parent)
  // For now parent uses the exported 'socket' instance directly for emitting actions
}

export default function SocketComponent({
  myColor,
  gameStatus,
  currentRoom: propCurrentRoom,
  onPlayerJoined,
  setGameStatus,
  setMyColor,
  onChatMessage,
  onRoomInfo,
  onGameInfo,
  onGameResult,
  onSearchStarted,
  onSearchCancelled
}: SocketComponentProps) {
  const t = useTranslations('Multiplayer');
  const [currentRoom, setCurrentRoom] = useState("");
  const { data: session } = useSession();

  const offensiveWords = [
    "fuck", "shit", "bitch", "asshole", "faggot", "retarded", "cunt", "damn",
    "dick", "pussy", "nigger", "whore", "slut", "bastard", "idiot", "stupid",
    "kys", "kill yourself", "hitler", "nazi"
  ];

  const filterMessage = (message: string) => {
    let filteredMessage = message;
    offensiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredMessage = filteredMessage.replace(regex, '***');
    });
    return filteredMessage;
  };

  // Register Player
  useEffect(() => {
    let playerId: string;
    if (session?.user?.id) {
      playerId = session.user.id;
    } else {
      let storedId = localStorage.getItem("playerId");
      if (!storedId) {
        storedId = generateId();
        localStorage.setItem("playerId", storedId);
      }
      playerId = storedId;
    }
    socket.emit("register_player", { playerId });
  }, [session?.user?.id]);

  useEffect(() => {
    if (propCurrentRoom) {
      setCurrentRoom(propCurrentRoom);
    }
  }, [propCurrentRoom]);

  // ---- Socket Listener ----
  useEffect(() => {
    socket.on("room_created", (data: any) => {
      console.log("Room created:", data);
      setCurrentRoom(data.roomId);
      onRoomInfo({ playerCount: 1, room: data.roomId });
      onGameResult(null);
      onGameInfo(t('roomCreated') + data.roomId);
    });

    socket.on("joined_room", (data: any) => {
      console.log("Joined room:", data);
      setCurrentRoom(data.roomId);
      onRoomInfo({ playerCount: 2, room: data.roomId });
      onGameResult(null);
      onGameInfo(t('joinedRoom'));
    });

    socket.on("start_game", (data: any) => {
      setMyColor(data.color);
      // Ensure specific room info is set
      onRoomInfo({ playerCount: 2, room: data.roomId || currentRoom });
      onPlayerJoined();
      onGameInfo(t('gameStarted'));
    });

    socket.on("room_not_found", () => {
      onGameInfo(t('roomNotFound'));
    });

    socket.on("room_full", () => {
      onGameInfo(t('roomFull'));
    });

    socket.on("already_in_room", () => {
      onGameInfo(t('alreadyInRoom'));
    });

    socket.on("opp_disconnected", () => {
      onGameInfo(t('opponentDisconnected'));
      onRoomInfo({ playerCount: 1, room: currentRoom });
    });

    socket.on("game_ended", async (data: any) => {
      setGameStatus("ended");

      // let result: "win" | "loss" | "draw" = "draw"; // This variable was declared but not used
      if (data.result === "0") {
        onGameResult("draw");
      } else {
        const iWon = (data.result === "w" && myColor === "white") ||
          (data.result === "b" && myColor === "black");
        onGameResult(iWon ? "win" : "loss");
      }
      onGameInfo(data.reason || t('gameEnded'));
    });

    socket.on("chat_message", (data: any) => {
      onChatMessage(filterMessage(data.message));
    });

    socket.on("error", (data: any) => {
      onGameInfo(`${t('error')}${data.message}`);
    });

    socket.on("quick_search_started", () => {
      onGameInfo(t('searchingForGame'));
      onSearchStarted?.();
    });

    socket.on("search_cancelled", () => {
      onGameInfo("");
      onSearchCancelled?.();
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
      socket.off("chat_message");
      socket.off("quick_search_started");
      socket.off("search_cancelled");
    };
  }, [currentRoom, myColor, onPlayerJoined, setGameStatus, onChatMessage, onRoomInfo, onGameResult, onGameInfo, t]);

  return null; // Headless
}