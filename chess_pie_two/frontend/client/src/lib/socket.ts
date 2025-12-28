// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("https://dein-server", {
      transports: ["websocket"],
    });
  }
  return socket;
}
