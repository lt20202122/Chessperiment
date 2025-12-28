"use client";
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, History, Info, Send, User, Monitor, Copy, Check, Share2 } from 'lucide-react';

interface GameSidebarProps {
    // Game State
    myColor: "white" | "black" | null;
    gameStatus: string;
    gameInfo: string;

    // History
    moveHistory: string[];
    historyIndex: number;
    navigateHistory: (direction: "prev" | "next" | "start" | "end") => void;
    exitHistoryView: () => void;
    isViewingHistory: boolean;

    // Chat (from SocketComponent)
    chatMessages: string[];
    onSendMessage: (msg: string) => void;

    // Room/Opponent (for Info tab)
    currentRoom: string;
    playerCount: number;
    opponentName?: string; // If we add names later

    // Actions (for bottom sticky, maybe?)
    // actions: React.ReactNode; 
}

export default function GameSidebar({
    myColor, gameStatus, gameInfo,
    moveHistory, historyIndex, navigateHistory, exitHistoryView, isViewingHistory,
    chatMessages, onSendMessage,
    currentRoom, playerCount
}: GameSidebarProps) {
    const t = useTranslations('GameSidebar');
    const [msgInput, setMsgInput] = useState("");
    const [copied, setCopied] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const handleSend = () => {
        if (!msgInput.trim()) return;
        onSendMessage(msgInput);
        setMsgInput("");
    };

    const handleCopyRoom = async () => {
        if (!currentRoom) return;
        try {
            await navigator.clipboard.writeText(currentRoom);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShareRoom = async () => {
        if (!currentRoom) return;
        const shareData = {
            title: 'Join my ChessPIE game!',
            text: `Join my chess game with room code: ${currentRoom}`,
            url: `${window.location.origin}/game?room=${currentRoom}`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled or error
                console.log('Share cancelled or failed');
            }
        } else {
            // Fallback to copy
            handleCopyRoom();
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-white dark:bg-stone-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 shadow-2xl z-40">
            <Tabs defaultValue="moves" className="flex-1 flex flex-col h-full">
                <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-stone-700 data-[state=active]:shadow-sm transition-all">
                            <Info size={18} className="mr-2" /> {t('info')}
                        </TabsTrigger>
                        <TabsTrigger value="moves" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-stone-700 data-[state=active]:shadow-sm transition-all">
                            <History size={18} className="mr-2" /> {t('moves')}
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-stone-700 data-[state=active]:shadow-sm transition-all">
                            <MessageSquare size={18} className="mr-2" /> {t('chat')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- MOVES TAB --- */}
                <TabsContent value="moves" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
                            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                                <div key={i} className="contents group">
                                    <div className="text-gray-400 text-right pr-2 py-1 select-none border-b border-transparent">
                                        {i + 1}.
                                    </div>
                                    <div className="contents">
                                        {/* White Move */}
                                        <button
                                            onClick={() => { /* Navigate to specific move index logic could go here */ }}
                                            className={`text-left pl-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors ${historyIndex === (i * 2) && isViewingHistory ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 font-bold' : ''
                                                }`}
                                        >
                                            {moveHistory[i * 2]}
                                        </button>
                                        {/* Black Move */}
                                        {moveHistory[i * 2 + 1] && (
                                            <button
                                                onClick={() => { /* Navigate logic */ }}
                                                className={`text-left pl-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors ${historyIndex === (i * 2 + 1) && isViewingHistory ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 font-bold' : ''
                                                    }`}
                                            >
                                                {moveHistory[i * 2 + 1]}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Navigation Bar */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 backdrop-blur-sm">
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => navigateHistory('start')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30" disabled={historyIndex < 0}>
                                |&lt;
                            </button>
                            <button onClick={() => navigateHistory('prev')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30" disabled={historyIndex < 0}>
                                &lt;
                            </button>
                            <button onClick={exitHistoryView} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isViewingHistory ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600' : 'bg-gray-200 text-gray-400'}`}>
                                {t('live')}
                            </button>
                            <button onClick={() => navigateHistory('next')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30" disabled={!isViewingHistory}>
                                &gt;
                            </button>
                            <button onClick={() => navigateHistory('end')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30" disabled={!isViewingHistory}>
                                &gt;|
                            </button>
                        </div>
                    </div>
                </TabsContent>

                {/* --- CHAT TAB --- */}
                <TabsContent value="chat" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-3">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 wrap-break-word">{msg}</p>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex gap-2">
                            <input
                                value={msgInput}
                                onChange={(e) => setMsgInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={t('placeholder')}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <button
                                onClick={handleSend}
                                className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </TabsContent>

                {/* --- INFO TAB --- */}
                <TabsContent value="info" className="flex-1 p-6 space-y-6">
                    <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-900 p-6 rounded-3xl border border-amber-100 dark:border-stone-700">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-4">{t('gameStatus')}</h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full ${gameStatus === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                <span className="font-medium text-lg capitalize">{gameStatus || 'Connecting...'}</span>
                            </div>

                            {gameInfo && (
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900">
                                    {gameInfo}
                                </div>
                            )}

                            <div className="pt-4 border-t border-dashed border-amber-200 dark:border-stone-700">
                                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                    <span>{t('roomCode')}</span>
                                </div>
                                {currentRoom ? (
                                    <div className="space-y-3">
                                        <code className="block w-full bg-white dark:bg-black px-4 py-3 rounded-xl border dark:border-gray-800 font-mono text-2xl font-bold text-center tracking-[0.3em] select-all text-amber-600 dark:text-amber-500">
                                            {currentRoom}
                                        </code>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleCopyRoom}
                                                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check size={18} />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={18} />
                                                        Copy Code
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleShareRoom}
                                                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <code className="block w-full bg-white dark:bg-black px-2 py-1 rounded border dark:border-gray-800 font-mono select-all text-center text-gray-400">
                                        ---
                                    </code>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                                <span>{t('players')}</span>
                                <div className="flex items-center gap-1">
                                    <User size={14} />
                                    <span>{playerCount}/2</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-stone-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{t('youArePlaying')}</h3>
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${myColor === 'white' ? 'bg-white border border-gray-200' : 'bg-black border border-gray-700 text-white'}`}>
                                {myColor === 'white' ? '♔' : '♚'}
                            </div>
                            <div>
                                <p className="font-bold text-lg capitalize">{myColor || 'Spectator'}</p>
                                <p className="text-xs text-gray-400">{t('yourSide')}</p>
                            </div>
                        </div>
                    </div>
                </TabsContent >
            </Tabs >
        </div >
    );
}
