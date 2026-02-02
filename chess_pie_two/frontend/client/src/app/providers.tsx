// app/providers.tsx
"use client";

import React from 'react';
import { SocketProvider } from '@/context/SocketContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SocketProvider>
            {children}
        </SocketProvider>
    );
}
