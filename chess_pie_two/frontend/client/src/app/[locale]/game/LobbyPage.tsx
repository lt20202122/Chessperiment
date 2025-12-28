"use client";
import { useRouter } from 'next/navigation';
import GameLobby from './GameLobby';
import { useSocket } from '@/context/SocketContext';
import { useState } from 'react';
export default function GamePage() {
    const router = useRouter();
    const socket = useSocket();
    const [isSearching, setIsSearching] = useState(false);

    const handleQuickSearch = () => {
        // Will be handled by socket, which will redirect when room is created
        // For now, create a temporary room ID
        // const tempRoomId = 'quick-' + Math.random().toString(36).substring(7);
        // router.push(`/game/${tempRoomId}?mode=quick`);
        socket.emit('quick_search');
        setIsSearching(true);

    };

    const handleCancelSearch = () => {
        setIsSearching(false);
        socket.emit("cancel_search");
    };

    const handleCreateRoom = () => {
        // Generate room ID and navigate
        const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();
        router.push(`/game/${roomId}?mode=create`);
    };

    const handleJoinRoom = (roomId: string) => {
        if (!roomId || roomId.length < 4) return;
        router.push(`/game/${roomId}?mode=join`);
    };

    const handleVsComputer = (elo: number) => {
        const roomId = `computer-${elo}`;
        router.push(`/game/${roomId}?mode=computer`);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-stone-100 dark:bg-stone-950 p-4">
            <GameLobby
                onQuickSearch={handleQuickSearch}
                onCancelSearch={handleCancelSearch}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                onVsComputer={handleVsComputer}
                isSearching={isSearching}
            />
        </div>
    );
}
