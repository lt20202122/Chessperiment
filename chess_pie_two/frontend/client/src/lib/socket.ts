// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getOrCreatePlayerId(): string {
  // Check if player ID exists in localStorage
  let playerId = localStorage.getItem("chess_player_id");
  
  if (!playerId) {
    // Generate a new unique player ID
    playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("chess_player_id", playerId);
  }
  
  return playerId;
}

export function getSocket() {
  if (!socket) {
    const isBrowser = typeof window !== "undefined";
    const host = isBrowser ? window.location.hostname : "localhost";
    socket = io(`http://${host}:3002`, {
      transports: ["websocket"],
    });

    // Register player immediately on connection
    socket.on("connect", () => {
      const playerId = getOrCreatePlayerId();
      console.log("Socket connected, registering player:", playerId);
      socket!.emit("register_player", { playerId });
    });

    // Add connection error handling
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }
  return socket;
}
