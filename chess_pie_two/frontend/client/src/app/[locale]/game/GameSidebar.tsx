"use client";
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, History, Info, Send, User, Monitor, Copy, Check, Share2 } from 'lucide-react';

interface GameSidebarProps {
    myColor: "white" | "black" | null;
    gameStatus: string;
    gameInfo: string;
    moveHistory: string[];
    historyIndex: number;
    navigateHistory: (direction: "prev" | "next" | "start" | "end") => void;
    exitHistoryView: () => void;
    isViewingHistory: boolean;
    chatMessages: string[];
    onSendMessage: (msg: string) => void;
    currentRoom: string;
    playerCount: number;
    onResign: () => void;
    onOfferDraw: () => void;
    onStartComputerGame: (elo: number) => void;
    gameMode: "online" | "computer" | "local";
    setGameMode: (mode: "online" | "computer" | "local") => void;
    currentTurn: 'w' | 'b';
    onLeaveGame: () => void;
}

export default function GameSidebar({
    myColor, gameStatus, gameInfo,
    moveHistory = [], historyIndex, navigateHistory, exitHistoryView, isViewingHistory,
    chatMessages = [], onSendMessage,
    currentRoom, playerCount,
    onResign, onOfferDraw, onStartComputerGame,
    gameMode, setGameMode,
    currentTurn, onLeaveGame
}: GameSidebarProps) {
    const t = useTranslations('GameSidebar');
    const [msgInput, setMsgInput] = useState("");
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("moves");
    const [hasUnreadChat, setHasUnreadChat] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === "chat") setHasUnreadChat(false);
    }, [activeTab]);

    useEffect(() => {
        if (chatMessages.length > 0 && activeTab !== "chat") {
            setHasUnreadChat(true);
        }
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, activeTab]);

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
            try { await navigator.share(shareData); } catch (err) { console.log('Share failed'); }
        } else {
            handleCopyRoom();
        }
    };

    return (
        <div className="h-[40vh] lg:h-full w-full lg:w-[400px] flex flex-col bg-white dark:bg-stone-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 shadow-2xl z-40">
            <Tabs defaultValue="moves" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <TabsTrigger value="info" className="rounded-lg transition-all"><Info size={18} className="mr-2" /> Info</TabsTrigger>
                        <TabsTrigger value="moves" className="rounded-lg transition-all"><History size={18} className="mr-2" /> Moves</TabsTrigger>
                        <TabsTrigger value="chat" className="rounded-lg transition-all relative">
                            <MessageSquare size={18} className="mr-2" />
                            Chat
                            {hasUnreadChat && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="moves" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                        <div className="flex flex-col gap-y-1 text-sm font-mono">
                            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                                <div key={i} className="contents group">
                                    <div className="text-gray-400 text-right pr-2 py-1 select-none border-b border-transparent">{i + 1}.</div>
                                    <div className="contents">
                                        <button className={`text-left pl-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors ${historyIndex === (i * 2) && isViewingHistory ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 font-bold' : ''}`}>
                                            {moveHistory[i * 2]}
                                        </button>
                                        {moveHistory[i * 2 + 1] && (
                                            <button className={`text-left pl-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors ${historyIndex === (i * 2 + 1) && isViewingHistory ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 font-bold' : ''}`}>
                                                {moveHistory[i * 2 + 1]}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => navigateHistory('start')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30" disabled={historyIndex < 0}>|&lt;</button>
                            <button onClick={() => navigateHistory('prev')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30" disabled={historyIndex < 0}>&lt;</button>
                            <button onClick={exitHistoryView} className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${isViewingHistory ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}>LIVE</button>
                            <button onClick={() => navigateHistory('next')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30" disabled={!isViewingHistory}>&gt;</button>
                            <button onClick={() => navigateHistory('end')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30" disabled={!isViewingHistory}>&gt;|</button>
                        </div>
                    </div>
                </TabsContent>

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
                            <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none" />
                            <button onClick={handleSend} className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20"><Send size={20} /></button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="info" className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-900 p-6 rounded-4xl border border-amber-100 dark:border-stone-700">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-4">Game Status</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`w-3 h-3 rounded-full ${gameStatus === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            <span className="font-bold text-lg capitalize">{gameStatus || 'Connecting...'}</span>
                        </div>
                        {gameInfo && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium mb-4">{gameInfo}</div>}
                        <div className="pt-4 border-t border-dashed border-amber-200 dark:border-stone-700">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Room Code</p>
                            {currentRoom ? (
                                <div className="space-y-3">
                                    <code className="block w-full bg-white dark:bg-black px-4 py-3 rounded-2xl border dark:border-gray-800 font-mono text-2xl font-black text-center tracking-[0.2em] text-amber-600 dark:text-amber-500">{currentRoom}</code>
                                    <div className="flex gap-2">
                                        <button onClick={handleCopyRoom} className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all">{copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy</>}</button>
                                        <button onClick={handleShareRoom} className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all"><Share2 size={20} /></button>
                                    </div>
                                </div>
                            ) : <div className="text-center text-gray-400 font-mono italic text-sm">No Active Room</div>}
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-stone-800/50 p-6 rounded-4xl border border-gray-100 dark:border-stone-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Match Details</h3>
                            <div className="flex items-center gap-1 text-gray-400"><User size={14} /><span className="text-xs font-bold">{playerCount}/2</span></div>
                        </div>

                        <div className="space-y-3">
                            {/* Player Info */}
                            <div className="flex items-center gap-3 bg-white dark:bg-black/20 p-3 rounded-2xl border border-gray-100 dark:border-stone-700/50">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${myColor === 'white' ? 'bg-white border text-stone-900' : 'bg-stone-950 text-white border border-stone-800'}`}>{myColor === 'white' ? '♔' : '♚'}</div>
                                <div><p className="font-bold text-sm capitalize">{myColor || 'Spectator'}</p><p className="text-[10px] text-gray-400">Your Side</p></div>
                            </div>

                            {/* Turn Info */}
                            <div className="flex items-center gap-3 bg-white dark:bg-black/20 p-3 rounded-2xl border border-gray-100 dark:border-stone-700/50">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${currentTurn === 'w' ? 'bg-white border text-stone-900 shadow-md' : 'bg-stone-900 border border-stone-800 text-white'}`}>
                                    {currentTurn === 'w' ? '♔' : '♚'}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{currentTurn === 'w' ? 'White' : 'Black'}'s Turn</p>
                                    <p className="text-[10px] text-gray-400">Current Move</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={onLeaveGame} className="w-full py-3 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-2xl font-bold transition-all text-sm">
                            &lt; Return to Lobby
                        </button>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onResign} disabled={gameStatus !== 'playing'} className="py-3 px-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all border border-red-500/20 disabled:opacity-30">Resign</button>
                    <button onClick={onOfferDraw} disabled={gameStatus !== 'playing'} className="py-3 px-4 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-2xl font-bold transition-all border border-blue-500/20 disabled:opacity-30">Offer Draw</button>
                    {gameMode === 'local' && (
                        <button onClick={() => onStartComputerGame(1500)} className="col-span-2 py-3 px-4 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-2xl font-bold transition-all border border-green-500/20 flex items-center justify-center gap-2">
                            <Monitor size={18} /> Practice vs Computer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
