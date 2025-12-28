// context/SocketContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);
  if (!socket) {
    return null;
  }
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used inside SocketProvider");
  }
  return socket;
}
