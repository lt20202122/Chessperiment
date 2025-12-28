// app/providers.tsx
"use client";

import { SocketProvider } from "@/context/SocketContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SocketProvider>
            {children}

        </SocketProvider>)
}