"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Game } from '@/engine/game';
import { BoardClass } from '@/engine/board';
import { Piece } from '@/engine/piece';
import { Square } from '@/engine/types';
import PieceRenderer from '@/components/game/PieceRenderer';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, MeasuringStrategy } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Undo2, AlertCircle, Info, Settings2, ArrowLeft, ZoomIn, ZoomOut, Play, Minus, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Globe, Copy, Share2 } from 'lucide-react';
import KillEffect from '@/components/game/KillEffect';
import { Project } from '@/types/Project';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSocket } from '@/context/SocketContext';
import { useSession } from 'next-auth/react';
import EngineToggleCard from '@/components/editor/EngineToggleCard';

// Draggable Piece Component
const DraggablePiece = React.memo(({ piece, size, amIAtTurn }: { piece: Piece; size: number; amIAtTurn: boolean }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: piece.position,
        data: piece,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    try {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...(amIAtTurn ? { ...attributes, ...listeners } : {})}
                className={`cursor-${amIAtTurn ? 'grab' : 'default'} ${isDragging ? 'opacity-0' : 'opacity-100'} relative z-20 w-full h-full flex items-center justify-center`}
            >
                <PieceRenderer
                    type={piece.type}
                    color={piece.color}
                    size={size}
                    hasLogic={(piece as any).isCustom}
                    variables={(piece as any).variables}
                    pixels={(piece as any).isCustom ? (piece.color === 'white' ? (piece as any).pixelsWhite : (piece as any).pixelsBlack) : undefined}
                    image={(piece as any).image}
                />
            </div>
        );
    } catch (e) {
        console.error("Piece render error:", e);
        return null;
    }
}, (prev, next) => prev.piece.id === next.piece.id && prev.piece.position === next.piece.position && prev.amIAtTurn === next.amIAtTurn);

// Low-dependency Square Component
function BoardSquare({ pos, isWhite, piece, size, onSelect, onContextMenu, isSelected, amIAtTurn, effects, onEffectComplete, hideCoordinates }: any) {
    const { setNodeRef, isOver } = useDroppable({ id: pos });

    return (
        <div
            ref={setNodeRef}
            onClick={() => onSelect(pos)}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(pos);
            }}
            className={`aspect-square relative flex items-center justify-center box-border ${isOver ? 'ring-4 ring-inset ring-amber-400' : ''} ${isSelected ? 'after:content-[""] after:absolute after:inset-0 after:bg-amber-400/30 after:ring-4 after:ring-inset after:ring-amber-400' : ''}`}
            style={{
                backgroundColor: isWhite ? '#ebecd0' : '#779556',
                zIndex: isSelected ? 2 : 1,
                overflow: 'visible'
            }}
        >
            {piece && (
                <DraggablePiece piece={piece} size={size * 0.9} amIAtTurn={amIAtTurn} />
            )}

            <AnimatePresence>
                {effects.map((effect: any) => (
                    <KillEffect
                        key={effect.id}
                        size={size}
                        onComplete={() => onEffectComplete(effect.id)}
                    />
                ))}
            </AnimatePresence>

            {/* Coordinate Labels */}
            {!hideCoordinates && pos[1] === '1' && (
                <span className={`absolute bottom-0.5 right-0.5 text-[9px] font-black select-none pointer-events-none ${isWhite ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>
                    {pos[0]}
                </span>
            )}
            {!hideCoordinates && pos[0] === 'a' && (
                <span className={`absolute top-0.5 left-0.5 text-[9px] font-black select-none pointer-events-none ${isWhite ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>
                    {pos[1]}
                </span>
            )}
        </div>
    );
}

// Wrapper interface to adapt to project structure
interface PlayBoardProps {
    project: Project | null;
    projectId: string;
    roomId?: string;
    mode?: 'online';
}

// Helper to create piece instance
function createPieceFromData(id: string, type: string, color: string, position: string, customPieces: any[]): Piece {
    // Look up by both name AND id (since placedPieces stores either)
    const customProto = customPieces.find(cp => cp.name === type || cp.id === type);
    let newPiece: Piece;

    if (customProto) {
        newPiece = Piece.create(
            id,
            type,
            color as any,
            position as any,
            customProto.moves || [],
            customProto.logic || []
        );
        if ((customProto as any).variables) (newPiece as any).variables = JSON.parse(JSON.stringify((customProto as any).variables));
        (newPiece as any).isCustom = true;
        (newPiece as any).pixelsWhite = customProto.pixelsWhite;
        (newPiece as any).pixelsBlack = customProto.pixelsBlack;
        (newPiece as any).image = color === 'white' ? customProto.imageWhite : customProto.imageBlack;
    } else {
        newPiece = Piece.create(id, type, color as any, position as any);
    }
    return newPiece;
}

export default function PlayBoard({ project, projectId, roomId, mode }: PlayBoardProps) {
    const router = useRouter();
    const socket = useSocket();
    const { data: session } = useSession();

    // Use local state for project to allow hydration from socket
    const [activeProject, setActiveProject] = useState<Project | null>(project);

    // -- Initialize Game from Project Data first, then use local state --
    const [game, setGame] = useState<Game | null>(null);
    const [board, setBoard] = useState<BoardClass | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [activePiece, setActivePiece] = useState<Piece | null>(null);
    const [logs, setLogs] = useState<{ msg: string, type: 'info' | 'move' | 'effect' }[]>([]);
    const [activeEffects, setActiveEffects] = useState<{ id: number, type: string, position: Square }[]>([]);

    // -- New State for Replicated Features --
    const [zoom, setZoom] = useState(1);
    const [validationEnabled, setValidationEnabled] = useState(true);

    // Online State
    const [myColor, setMyColor] = useState<"white" | "black" | null>(null);
    const [isOnline, setIsOnline] = useState(mode === 'online');
    const [waitingForOpponent, setWaitingForOpponent] = useState(isOnline);
    const [pendingHistory, setPendingHistory] = useState<string[] | null>(null);

    // History State
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [historySnapshots, setHistorySnapshots] = useState<Record<string, Piece | null>[]>([]);
    const [viewIndex, setViewIndex] = useState(0);
    const [copySuccess, setCopySuccess] = useState(false);

    // Engine toggle state (local play only)
    const [engineEnabled, setEngineEnabled] = useState(false);
    const [engineColor, setEngineColor] = useState<'white' | 'black'>('black');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
    );

    useEffect(() => {
        if (project) setActiveProject(project);
    }, [project]);

    // Initial Setup Effect
    useEffect(() => {
        setIsMounted(true);
        if (!activeProject) return;
        try {
            // Reconstruct the board from project data
            const {
                rows = 8,
                cols = 8,
                placedPieces = {},
                activeSquares = [],
                customPieces = []
            } = activeProject;

            // Create squares map for board constructor
            const initialSquares: Record<string, Piece | null> = {};

            const toAlgebraic = (coord: string, bH: number): string => {
                if (!coord.includes(',')) return coord;
                const [x, y] = coord.split(',').map(Number);
                const file = String.fromCharCode(97 + x);
                const rank = bH - y;
                return `${file}${rank}`;
            };

            const actualHeight = activeProject.rows || 8;

            Object.entries(placedPieces).forEach(([sq, pData]: [string, any]) => {
                const normalizedSq = toAlgebraic(sq, actualHeight);

                if (activeSquares.length > 0) {
                    const normalizedActive = activeSquares.map((a: string) => toAlgebraic(a, actualHeight));
                    if (!normalizedActive.includes(normalizedSq)) return;
                }

                const pieceId = `${normalizedSq}_${pData.color}_${pData.type}_${Date.now()}`;
                const newPiece = createPieceFromData(pieceId, pData.type, pData.color, normalizedSq, customPieces);

                if (newPiece) {
                    initialSquares[normalizedSq] = newPiece;
                }
            });

            // Normalize Square Logic
            const normalizedSquareLogic: Record<string, any> = {};
            if (activeProject.squareLogic) {
                Object.entries(activeProject.squareLogic).forEach(([sqId, def]) => {
                    const algSq = toAlgebraic(sqId, actualHeight);

                    // Convert variables array to Record<string, any>
                    const varRecord: Record<string, any> = {};
                    if (def.variables && Array.isArray(def.variables)) {
                        def.variables.forEach((v: any) => {
                            varRecord[v.name || v.id] = v.value;
                        });
                    }

                    normalizedSquareLogic[algSq] = {
                        logic: def.logic || [],
                        variables: varRecord,
                        squareId: algSq
                    };
                });
            }

            const newBoard = new BoardClass(
                initialSquares,
                activeSquares.length > 0 ? activeSquares.map((a: string) => toAlgebraic(a, actualHeight)) : undefined,
                cols,
                rows,
                activeProject.gridType || 'square',
                normalizedSquareLogic
            );

            const newGame = new Game(newBoard);
            setGame(newGame);
            setBoard(newGame.getBoard());

            const initialSnapshot = JSON.parse(JSON.stringify(newGame.getBoard().getSquares()));
            setHistorySnapshots([initialSnapshot]);
            setMoveHistory([]);
            setViewIndex(0);

            setLogs([{ msg: 'Game Initialized', type: 'info' }]);

        } catch (err) {
            console.error(err);
            toast.error("Failed to load game");
        }
    }, [activeProject]);

    // Socket Connection
    useEffect(() => {
        if (!socket || !isOnline || !roomId) return;

        const register = () => {
            let pId = localStorage.getItem("chess_player_id");
            if (!pId && session?.user?.id) {
                pId = session.user.id;
                localStorage.setItem("chess_player_id", pId);
            }
            if (!pId) {
                pId = Math.random().toString(36).substring(2, 15);
                localStorage.setItem("chess_player_id", pId);
            }
            socket.emit("register_player", { playerId: pId });
            socket.emit("join_room", { roomId, pId });
        };

        register();
        socket.on("connect", register);

        return () => {
            socket.off("connect", register);
        };
    }, [socket, isOnline, roomId, session]);

    // Pending History Processing
    useEffect(() => {
        if (!pendingHistory || !game) return;

        console.log("Replaying history:", pendingHistory);

        // Replay history
        const newMoves: string[] = [];
        const newSnapshots = [historySnapshots[0] || JSON.parse(JSON.stringify(game.getBoard().getSquares()))];

        for (const moveStr of pendingHistory) {
            const parts = moveStr.split(' -> ');
            if (parts.length === 2) {
                const from = parts[0] as Square;
                const to = parts[1] as Square;
                if (game.makeMove(from, to)) {
                    newMoves.push(moveStr);
                    newSnapshots.push(JSON.parse(JSON.stringify(game.getBoard().getSquares())));
                }
            }
        }

        setHistorySnapshots(newSnapshots);
        setMoveHistory(newMoves);
        setViewIndex(newSnapshots.length - 1);

        const newBoard = game.getBoard().clone();
        setBoard(newBoard);
        setPendingHistory(null);

    }, [pendingHistory, game]); // historySnapshots[0] assumed stable or handled

    // Socket Event Handlers
    useEffect(() => {
        if (!socket || !isOnline) return;

        const onRoomCreated = (data: any) => {
            setMyColor(data.color);
            setWaitingForOpponent(true);
        };

        const onJoinedRoom = (data: any) => {
            setMyColor(data.color);
            setWaitingForOpponent(true);
            if (data.customData) {
                setActiveProject(data.customData);
            }
        };

        const onStartGame = (data: any) => {
            setWaitingForOpponent(false);
            toast.success("Game Started!");
            if (data.customData) {
                setActiveProject(data.customData);
            }
        };

        const onRejoinGame = (data: any) => {
            // Correctly handle spectator (color "")
            const colorMap: any = { 'white': 'white', 'black': 'black' };
            setMyColor(colorMap[data.color] || null);

            if (data.status === 'playing') setWaitingForOpponent(false);
            if (data.customData) {
                setActiveProject(data.customData);
            }
            if (data.history && data.history.length > 0) {
                setPendingHistory(data.history);
            }
        };

        const onMove = (data: any) => {
            if (!game || !board) return;
            // Remote move
            if (data.from && data.to) {
                const success = game.makeMove(data.from, data.to);
                if (success) {
                    const moveDesc = data.san || `${data.from} -> ${data.to}`;
                    addLog(`Opponent: ${moveDesc}`, 'move');
                    const sound = new Audio('/sounds/move-self.mp3');
                    sound.play().catch(() => { });

                    const snapshot = JSON.parse(JSON.stringify(game.getBoard().getSquares()));
                    setHistorySnapshots(prev => [...prev, snapshot]);
                    setMoveHistory(prev => [...prev, moveDesc]);
                    setViewIndex(prev => prev + 1);

                    const newBoard = game.getBoard().clone();
                    setBoard(newBoard);
                }
            }
        };

        socket.on("room_created", onRoomCreated);
        socket.on("joined_room", onJoinedRoom);
        socket.on("start_game", onStartGame);
        socket.on("rejoin_game", onRejoinGame);
        socket.on("move", onMove);

        return () => {
            socket.off("room_created", onRoomCreated);
            socket.off("joined_room", onJoinedRoom);
            socket.off("start_game", onStartGame);
            socket.off("rejoin_game", onRejoinGame);
            socket.off("move", onMove);
        };
    }, [socket, isOnline, game, board]);


    // -- Prototype Logic --

    const squares = useMemo(() => board ? board.getSquares() : {}, [board]);
    const currentTurn = board ? board.getTurn() : "white";

    const addLog = useCallback((msg: string, type: 'info' | 'move' | 'effect' = 'info') => {
        setLogs(prev => [{ msg, type }, ...prev].slice(0, 50));
    }, []);

    useEffect(() => {
        if (!board) return;
        const handleEffect = (effect: { type: string, position: Square }) => {
            const id = Date.now() + Math.random();
            setActiveEffects(prev => [...prev, { ...effect, id }]);
            addLog(`Effect: ${effect.type} at ${effect.position}`, 'effect');
        };

        board.addEffectListener(handleEffect);
        return () => board.removeEffectListener(handleEffect);
    }, [board, addLog]);

    const handleEffectComplete = (id: number) => {
        setActiveEffects(prev => prev.filter(e => e.id !== id));
    };

    // -- History Navigation --
    const jumpToSnapshot = (index: number) => {
        if (!historySnapshots[index] || !activeProject) return;

        const snapshotSquares = historySnapshots[index];
        const hydratedSquares: Record<string, Piece | null> = {};

        Object.entries(snapshotSquares).forEach(([sq, pData]: [string, any]) => {
            if (!pData) {
                hydratedSquares[sq] = null;
                return;
            }
            const piece = createPieceFromData(pData.id, pData.type, pData.color, pData.position, activeProject.customPieces || []);
            if (pData.variables) {
                (piece as any).variables = pData.variables;
            }
            hydratedSquares[sq] = piece;
        });

        const restoredBoard = new BoardClass(
            hydratedSquares,
            activeProject.activeSquares?.length ? activeProject.activeSquares : undefined,
            activeProject.cols || 8,
            activeProject.rows || 8,
            activeProject.gridType || 'square'
        );

        const restoredGame = new Game(restoredBoard);
        setGame(restoredGame);
        setBoard(restoredBoard);
        setViewIndex(index);
    };

    const handleDragStart = (e: DragStartEvent) => {
        if (!squares) return;
        if (viewIndex !== historySnapshots.length - 1) return;

        const piece = squares[e.active.id as Square];
        // Check turn and ownership
        if (piece && piece.color === currentTurn) {
            // Online check
            if (isOnline && myColor && piece.color !== myColor) return;

            setActivePiece(piece);
            setSelectedSquare(e.active.id as Square);
        }
    };

    const executeMove = (from: Square, to: Square) => {
        if (!game || !board || !squares) return false;

        let success = false;
        if (validationEnabled) {
            success = game.makeMove(from, to);
        } else {
            success = board.movePiece(from, to, 'Queen');
        }

        if (success) {
            const moveDesc = `${from} -> ${to}`;
            addLog(`Move: ${moveDesc}`, 'move');
            const sound = new Audio('/sounds/move-self.mp3');
            sound.play().catch(() => { });

            // Update History
            const snapshot = JSON.parse(JSON.stringify(game.getBoard().getSquares()));
            setHistorySnapshots(prev => [...prev, snapshot]);
            setMoveHistory(prev => [...prev, moveDesc]);
            setViewIndex(prev => prev + 1);

            // Emit to server if online
            if (isOnline && socket) {
                socket.emit("move", {
                    from,
                    to,
                    san: moveDesc,
                    fen: "CUSTOM_FEN_PLACEHOLDER" // Server uses this to update state, we don't have true FEN for custom yet, but sending dummy or custom serialization helps
                });
            }
        } else {
            console.warn(`[Engine] Move rejected or prevented: ${from} -> ${to}`);
        }

        const newBoard = game.getBoard().clone();
        setBoard(newBoard);
        return success;
    };

    const handleSquareClick = (pos: Square) => {
        if (viewIndex !== historySnapshots.length - 1) return;

        if (selectedSquare) {
            if (selectedSquare === pos) {
                setSelectedSquare(null);
            } else {
                const moveSuccess = executeMove(selectedSquare, pos);
                if (moveSuccess) {
                    setSelectedSquare(null);
                } else {
                    // Check if clicked another of own pieces
                    const pieceOnTarget = squares[pos];
                    if (pieceOnTarget && pieceOnTarget.color === currentTurn) {
                        if (isOnline && myColor && pieceOnTarget.color !== myColor) return;
                        setSelectedSquare(pos);
                    } else {
                        setSelectedSquare(null);
                    }
                }
            }
        } else {
            const piece = squares[pos];
            if (piece && piece.color === currentTurn) {
                if (isOnline && myColor && piece.color !== myColor) return;
                setSelectedSquare(pos);
            }
        }
    };

    const handleRightClick = (pos: Square) => {
        const piece = squares[pos];
        if (!piece || !activeProject) return;

        // Find if it's a custom piece
        const customProto = activeProject.customPieces.find(cp => cp.name === piece.type || cp.id === piece.type);

        if (customProto) {
            toast(`Edit ${customProto.name}?`, {
                action: {
                    label: 'Edit',
                    onClick: () => router.push(`/editor/${projectId}/piece-editor?pieceId=${customProto.id}`)
                },
                description: "Jump to Piece Editor to modify logic/pixels."
            });
        }
    };

    const handleDragEnd = (e: DragEndEvent) => {
        if (viewIndex !== historySnapshots.length - 1) return;
        setActivePiece(null);

        const { active, over } = e;
        if (over && active.id !== over.id) {
            executeMove(active.id as Square, over.id as Square);
        }
        setSelectedSquare(null);
    };

    const handleUndo = () => {
        if (viewIndex <= 0) return;
        if (isOnline) return; // Undo disabled in online mode for now

        const newIndex = viewIndex - 1;
        const newSnapshots = historySnapshots.slice(0, newIndex + 1);
        const newMoves = moveHistory.slice(0, newIndex);

        setHistorySnapshots(newSnapshots);
        setMoveHistory(newMoves);
        jumpToSnapshot(newIndex);
        addLog('Undo Move', 'info');
    };

    const handleReset = () => {
        if (isOnline) return;
        window.location.reload();
    };

    const handleCopyRoomCode = async () => {
        if (!roomId) return;
        try {
            await navigator.clipboard.writeText(roomId);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            toast.success('Room code copied!');
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy code');
        }
    };

    const handleShareGame = async () => {
        if (!roomId) return;
        const link = `${window.location.origin}/editor/${projectId}/play?roomId=${roomId}&mode=online`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join my ${activeProject?.name} game!`,
                    text: `Join my custom chess variant: ${activeProject?.name}`,
                    url: link,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(link);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
                toast.success('Link copied!');
            } catch (err) {
                console.error('Failed to copy:', err);
                toast.error('Failed to copy link');
            }
        }
    };


    // -- Rendering --

    if (!isMounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                    <div className="text-stone-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                        Wird geladen...
                    </div>
                </div>
            </div>
        );
    }

    if (!activeProject && isOnline) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                    <div className="text-stone-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                        Synchronizing Game Data...
                    </div>
                </div>
            </div>
        );
    }

    if (!activeProject || !board || !game) return null;

    const allFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const allRanks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const bW = board.width || 8;
    const bH = board.height || 8;
    const files = allFiles.slice(0, bW);
    const ranks = allRanks.slice(Math.max(0, 8 - bH));

    return (
        <div className="min-h-screen flex flex-col">
            {/* Simple Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-stone-800 z-50">
                <button onClick={() => router.push(`/editor/${projectId}`)} className="text-stone-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft size={18} /> Back
                </button>
                {isOnline && roomId && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-stone-800 rounded-lg border border-stone-700">
                        <Globe size={14} className="text-amber-500" />
                        <span className="text-xs font-mono text-stone-400">Room: <span className="text-white font-bold">{roomId}</span></span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-8 p-4 lg:p-8 max-w-7xl mx-auto w-full justify-center">

                {/* Board Area */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">

                    {waitingForOpponent && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                            <h3 className="text-xl font-bold text-white mb-2">Waiting for Opponent...</h3>
                            <div className="bg-stone-900/80 rounded-2xl p-6 max-w-sm">
                                <p className="text-stone-400 text-sm mb-3 text-center">Share the room code:</p>
                                <div
                                    onClick={handleCopyRoomCode}
                                    className="bg-stone-800 rounded-xl p-3 mb-4 cursor-pointer hover:bg-stone-700 transition-colors"
                                >
                                    <p className="text-amber-500 font-mono font-bold text-2xl text-center select-all">
                                        {roomId}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopyRoomCode}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-white font-bold transition-colors"
                                    >
                                        <Copy size={16} />
                                        {copySuccess ? 'Copied!' : 'Copy Code'}
                                    </button>
                                    <button
                                        onClick={handleShareGame}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl text-white font-bold transition-colors"
                                    >
                                        <Share2 size={16} />
                                        Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        measuring={{
                            droppable: {
                                strategy: MeasuringStrategy.WhileDragging,
                            },
                        }}
                    >
                        <div className="relative shadow-2xl rounded-xl border-8 border-stone-800 bg-stone-800 shadow-stone-950/50 overflow-visible transition-all duration-300"
                            style={{ transform: `scale(${zoom})` }}>
                            <div
                                className="grid"
                                style={{
                                    gridTemplateColumns: `repeat(${bW}, 1fr)`,
                                    gridTemplateRows: `repeat(${bH}, 1fr)`,
                                    zIndex: 20,
                                    position: 'relative',
                                    width: 'min(560px, 85vw)',
                                    aspectRatio: `${bW} / ${bH}`,
                                    backgroundColor: '#292524',
                                }}
                            >
                                {ranks.map((rank, rIdx) => (
                                    files.map((file, fIdx) => {
                                        const pos = `${file}${rank}` as Square;
                                        const isWhite = (rIdx + fIdx) % 2 === 0;

                                        if (!board.isActive(pos)) {
                                            return <div key={pos} className="aspect-square bg-transparent" />;
                                        }

                                        // Determine if it's my turn to allow interaction
                                        const piece = squares[pos];
                                        const pieceOwner = piece?.color === currentTurn;
                                        const canInteract = !waitingForOpponent && (!isOnline || (myColor && piece?.color === myColor && currentTurn === (myColor === 'white' ? 'white' : 'black')));

                                        return (
                                            <BoardSquare
                                                key={pos}
                                                pos={pos}
                                                isWhite={isWhite}
                                                piece={squares[pos]}
                                                size={70}
                                                onSelect={handleSquareClick}
                                                onContextMenu={handleRightClick}
                                                isSelected={selectedSquare === pos}
                                                amIAtTurn={canInteract}
                                                effects={activeEffects.filter(e => e.position === pos)}
                                                onEffectComplete={handleEffectComplete}
                                            />
                                        );
                                    })
                                ))}
                            </div>
                        </div>

                        <DragOverlay>
                            {activePiece ? (
                                <div className="opacity-80 scale-110 flex items-center justify-center pointer-events-none" style={{ width: 70 * zoom, height: 70 * zoom }}>
                                    <PieceRenderer
                                        type={activePiece.type}
                                        color={activePiece.color}
                                        size={70 * zoom}
                                        pixels={(activePiece as any).isCustom ? (activePiece.color === 'white' ? (activePiece as any).pixelsWhite : (activePiece as any).pixelsBlack) : undefined}
                                        image={(activePiece as any).image}
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>

                    <div className="mt-6 flex items-center gap-4">
                        {!isOnline && (
                            <>
                                <button
                                    onClick={handleUndo}
                                    className="flex items-center gap-2 px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-xl font-bold transition-colors text-white"
                                >
                                    <Undo2 size={18} /> Undo
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all"
                                >
                                    <RefreshCw size={18} /> Reset
                                </button>
                            </>
                        )}
                        {isOnline && (
                            <div className="px-4 py-2 bg-stone-800 rounded-xl text-stone-400 font-bold text-sm">
                                Playing as: <span className={myColor === 'white' ? 'text-white' : 'text-stone-500'}>{myColor}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="w-full lg:w-80 flex flex-col gap-6 h-full justify-center">

                    {/* Engine Toggle Card - Local Play Only */}
                    {!isOnline && (
                        <EngineToggleCard
                            enabled={engineEnabled}
                            color={engineColor}
                            onToggle={() => setEngineEnabled(!engineEnabled)}
                            onColorChange={setEngineColor}
                        />
                    )}

                    {/* Controls Card */}
                    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl border border-stone-200 dark:border-stone-800 space-y-6">
                        <div className="flex items-center gap-3 border-b border-stone-100 dark:border-white/10 pb-4">
                            <div className="p-2 bg-amber-500 rounded-xl text-white">
                                <Play size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight leading-none text-stone-900 dark:text-white">
                                    {isOnline ? 'Online Match' : 'Play'}
                                </h2>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                                    {isOnline ? 'Multiplayer' : 'Gegen dich selbst spielen'}
                                </p>
                            </div>
                        </div>

                        {/* Validation Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-stone-600 dark:text-stone-400">Zugvalidierung</span>
                            <button
                                onClick={() => setValidationEnabled(!validationEnabled)}
                                className={`w-12 h-7 rounded-full transition-colors relative ${validationEnabled ? 'bg-green-500' : 'bg-stone-300 dark:bg-stone-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${validationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Zoom Controls */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Zoom</span>
                                <span className="text-xs font-black tabular-nums text-stone-900 dark:text-white">{Math.round(zoom * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
                                <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="flex-1 p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-stone-500 dark:text-stone-400">
                                    <Minus size={16} className="mx-auto" />
                                </button>
                                <div className="w-px h-4 bg-stone-300 dark:bg-stone-700" />
                                <button onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} className="flex-1 p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-stone-500 dark:text-stone-400">
                                    <Plus size={16} className="mx-auto" />
                                </button>
                            </div>
                        </div>

                        {!isOnline && (
                            <div className="border-t border-stone-200 dark:border-white/10 pt-4 flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleUndo}
                                    className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    Undo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Move History */}
                    <div className="flex-1 bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden max-h-[400px]">
                        <div className="p-4 border-b border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-stone-950/30 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-stone-500">Züge ({moveHistory.length})</span>
                            <div className="flex gap-1">
                                <button
                                    disabled={viewIndex === 0}
                                    onClick={() => jumpToSnapshot(viewIndex - 1)}
                                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    disabled={viewIndex === historySnapshots.length - 1}
                                    onClick={() => jumpToSnapshot(viewIndex + 1)}
                                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    disabled={viewIndex === historySnapshots.length - 1}
                                    onClick={() => jumpToSnapshot(historySnapshots.length - 1)}
                                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                    <ChevronsRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                            <div className="grid grid-cols-2 gap-2">
                                {moveHistory.map((move, i) => (
                                    <button
                                        key={i}
                                        onClick={() => jumpToSnapshot(i + 1)}
                                        className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${viewIndex === (i + 1) ? 'bg-amber-500 text-white' : 'bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-stone-400'}`}
                                    >
                                        <span className={`mr-2 ${viewIndex === (i + 1) ? 'text-white/60' : 'text-stone-400 dark:text-stone-600'}`}>{Math.floor(i / 2) + 1}.</span>
                                        {move}
                                    </button>
                                ))}
                                {moveHistory.length === 0 && (
                                    <div className="col-span-2 text-center py-4 text-stone-400 text-xs italic">
                                        Noch keine Züge
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}