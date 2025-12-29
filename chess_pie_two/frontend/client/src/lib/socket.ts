// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:3002", { // Connect to the TypeScript backend
      transports: ["websocket"],
    });
  }
  return socket;
}
