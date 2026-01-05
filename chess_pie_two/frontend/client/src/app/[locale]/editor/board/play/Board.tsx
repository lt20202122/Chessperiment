"use client";
import React, { useState, useEffect, useRef, memo } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Minus, Plus, Shield, ShieldOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    useDraggable,
    useDroppable,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
} from "@dnd-kit/core";
import { getPieceImage, PieceType } from "../../../game/Data";
import PieceRenderer from "@/components/game/PieceRenderer";
import "../../../game/Board.css";
import { type Square } from '@/engine/types'
import { Game } from '@/engine/game'
import { BoardClass } from "@/engine/board";
import { Piece } from "@/engine/piece";
export interface Coord {
    col: number;
    row: number;
}

export interface PlacedPiece {
    type: string;
    color: string;
    size?: number;
}

export type PlacedPieces = Record<string, PlacedPiece>;

export interface CustomBoard {
    cols: number;
    rows: number;
    activeSquares: Coord[];
    placedPieces: PlacedPieces;
}

// --- DraggablePiece ---
const DraggablePiece = memo(function DraggablePiece({
    piece,
    size,
    isTurn,
    onClick,
    boardStyle = "v3",
}: {
    piece: PlacedPiece & { position: string };
    size: number;
    isTurn: boolean;
    onClick: () => void;
    boardStyle?: string;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: piece.position, data: piece });

    const style: React.CSSProperties = {
        fontSize: size,
        cursor: isTurn ? "grab" : "default",
        userSelect: "none",
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isDragging ? 0 : 1,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "none",
        zIndex: 20,
    };

    return (
        <div ref={setNodeRef} {...(isTurn ? { ...attributes, ...listeners } : {})} style={style} onClick={onClick}>
            <PieceRenderer
                type={piece.type}
                color={piece.color}
                size={size}
                boardStyle={boardStyle}
            />
        </div>
    );
});

// --- SquareTile ---
const SquareTile = memo(function SquareTile({
    pos,
    isWhite,
    piece,
    blockSize,
    selected,
    isMoveFrom,
    isMoveTo,
    onClick,
    onContextMenu,
    boardStyle,
    isTurn,
    squareRefs,
}: {
    pos: string;
    isWhite: boolean;
    piece?: PlacedPiece & { position: string };
    blockSize: number;
    selected: boolean;
    isMoveFrom: boolean;
    isMoveTo: boolean;
    onClick: (p: string) => void;
    onContextMenu: (p: string) => void;
    boardStyle: string;
    isTurn: boolean;
    squareRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
    const { setNodeRef } = useDroppable({ id: pos });

    const combinedRef = (el: HTMLDivElement | null) => {
        setNodeRef(el);
        if (squareRefs.current) squareRefs.current[pos] = el;
    };

    return (
        <div
            ref={combinedRef}
            className={` ${isWhite ? "bg-[#e9edcc]" : "bg-[#779954]"} ${isMoveFrom ? "move-from" : ""
                } ${isMoveTo ? "move-to" : ""} m-0 aspect-square relative flex items-center justify-center ${selected ? "ring-4 ring-blue-500" : ""
                }`}
            style={{ width: blockSize, height: blockSize }}
            onClick={() => onClick(pos)}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(pos);
            }}
        >
            {piece && <DraggablePiece piece={piece} size={piece.size ?? blockSize * 0.8} isTurn={isTurn} onClick={() => onClick(pos)} boardStyle={boardStyle} />}
        </div>
    );
});

// --- Board Component ---
export default function Board({ board }: { board: CustomBoard }) {
    const t = useTranslations("Editor.Board.Play");
    const gameRef = useRef<Game | null>(null);
    const [boardPieces, setBoardPieces] = useState<(PlacedPiece & { position: string })[]>([]);
    const [currentTurn, setCurrentTurn] = useState<"w" | "b">("w");
    const [blockSize, setBlockSize] = useState(80);
    const [selectedPos, setSelectedPos] = useState<string | null>(null);
    const [customCollection, setCustomCollection] = useState<Record<string, any>>({});

    useEffect(() => {
        const saved = localStorage.getItem('piece_collection');
        if (saved) {
            try {
                setCustomCollection(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load piece collection", e);
            }
        }
    }, []);
    const [activePiece, setActivePiece] = useState<string | null>(null);
    const [lastMoveFrom, setLastMoveFrom] = useState<string | null>(null);
    const [lastMoveTo, setLastMoveTo] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [redMarkedSquares, setRedMarkedSquares] = useState<Set<string>>(new Set());
    const [validationEnabled, setValidationEnabled] = useState(true);
    const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);
    const [showKingWarning, setShowKingWarning] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    const squareRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const toEngineSq = (pos: string): Square => {
        const [col, row] = pos.split(',').map(Number);
        return `${col},${board.rows - 1 - row}`;
    };

    const fromEngineSq = (sq: Square): string => {
        const [col, row] = sq.split(',').map(Number);
        return `${col},${board.rows - 1 - row}`;
    };

    const checkMoveLegal = (from: string, to: string) => {
        if (!validationEnabled) return true;
        if (!gameRef.current) return false;
        const fromSq = toEngineSq(from);
        const toSq = toEngineSq(to);

        const boardClone = gameRef.current.getBoard().clone();
        const gameClone = new Game(boardClone);
        return gameClone.makeMove(fromSq, toSq);
    };

    const hasKings = () => {
        const whiteKing = boardPieces.some(p => p.type === 'king' && p.color === 'white');
        const blackKing = boardPieces.some(p => p.type === 'king' && p.color === 'black');
        return whiteKing && blackKing;
    };

    const isPromotionMove = (from: string, to: string) => {
        const piece = getPieceAt(from);
        if (!piece || piece.type !== 'pawn') return false;
        const engineTo = toEngineSq(to);
        const [_, row] = engineTo.split(',').map(Number);
        return (piece.color === 'white' && row === board.rows - 1) ||
            (piece.color === 'black' && row === 0);
    };

    const toggleValidation = () => {
        if (!validationEnabled && !hasKings()) {
            setIsShaking(true);
            setShowKingWarning(true);
            setTimeout(() => {
                setIsShaking(false);
                setShowKingWarning(false);
            }, 3000);
            return;
        }
        setValidationEnabled(!validationEnabled);
    };

    useEffect(() => {
        // Convert editor pieces to engine pieces
        const enginePieces: Record<Square, Piece | null> = {};
        Object.entries(board.placedPieces).forEach(([pos, piece]) => {
            const enginePos = toEngineSq(pos);
            // Search for rules in customCollection by name
            const customPieceData = Object.values(customCollection).find(p => p.name === piece.type);
            const rules = customPieceData?.moves || [];

            const enginePiece = Piece.create(`${pos}_${piece.color}_${piece.type}`, piece.type as any, piece.color as any, enginePos, rules);
            if (enginePiece) {
                enginePieces[enginePos] = enginePiece;
            }
        });

        // Initialize engine with custom board state and active squares
        const activeSquaresArr = board.activeSquares.map(s => toEngineSq(`${s.col},${s.row}`));
        const customBoardObj = new BoardClass(enginePieces, activeSquaresArr, board.cols, board.rows);
        gameRef.current = new Game(customBoardObj);

        // Update UI state
        const piecesArray: (PlacedPiece & { position: string })[] = Object.entries(board.placedPieces).map(
            ([pos, piece]) => ({ ...piece, position: pos })
        );

        setBoardPieces(piecesArray);

        // Check if kings are present to determine if validation can be ON
        const whiteKing = piecesArray.some(p => p.type === 'king' && p.color === 'white');
        const blackKing = piecesArray.some(p => p.type === 'king' && p.color === 'black');
        setValidationEnabled(whiteKing && blackKing);
    }, [board, customCollection]);

    // Resize
    useEffect(() => {
        const updateSize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const availableWidth = w * 0.95;
            const availableHeight = h * 0.85;
            const maxBoardSize = Math.min(availableWidth, availableHeight);
            const newBlockSize = Math.floor(maxBoardSize / board.cols);
            setBlockSize(Math.max(Math.min(newBlockSize, 80), 30) * zoom);
        };
        window.addEventListener("resize", updateSize);
        updateSize();
        return () => window.removeEventListener("resize", updateSize);
    }, [board.cols, zoom]);

    // Keyboard Shortcuts for Zoom
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "+" || e.key === "=") {
                setZoom(prev => Math.min(2.5, prev + 0.1));
            } else if (e.key === "-" || e.key === "_") {
                setZoom(prev => Math.max(0.3, prev - 0.1));
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const getPieceAt = (pos: string) => boardPieces.find((p) => p.position === pos);

    const syncFromEngine = () => {
        if (!gameRef.current) return;
        const squares = gameRef.current.getBoard().getSquares();
        const newPiecesArray: (PlacedPiece & { position: string })[] = [];
        for (const [sq, piece] of Object.entries(squares)) {
            if (piece) {
                const editorPos = fromEngineSq(sq as Square);
                newPiecesArray.push({
                    type: piece.type,
                    color: piece.color,
                    position: editorPos,
                    size: blockSize * 0.8
                });
            }
        }
        setBoardPieces(newPiecesArray);
        setCurrentTurn(gameRef.current.getTurn() === "white" ? "w" : "b");
    };

    const executeMove = (from: string, to: string, promotion?: string) => {
        if (!gameRef.current) return;

        const engineFrom = toEngineSq(from);
        const engineTo = toEngineSq(to);

        const isCapture = !!gameRef.current.getBoard().getPiece(engineTo);

        // If validation is disabled, we might need to manually update the board state in the engine
        // or just use a special flag. For now, since it's "Play vs yourself", 
        // we can still use makeMove but we skip the validator if validationEnabled is false.

        // Actually, game.makeMove calls validator.isLegal. 
        // If validation is OFF, we should probably force the move.
        if (!validationEnabled) {
            gameRef.current.getBoard().movePiece(engineFrom, engineTo, promotion);
            syncFromEngine();
            setLastMoveFrom(from);
            setLastMoveTo(to);
            setSelectedPos(null);
            const sound = isCapture ? "/sounds/capture.mp3" : "/sounds/move-self.mp3";
            const audio = new Audio(sound);
            audio.play().catch(() => { });
            return;
        }

        if (gameRef.current.makeMove(engineFrom, engineTo, promotion)) {
            syncFromEngine();
            setLastMoveFrom(from);
            setLastMoveTo(to);
            setSelectedPos(null);

            const sound = isCapture ? "/sounds/capture.mp3" : "/sounds/move-self.mp3";
            const audio = new Audio(sound);
            audio.play().catch(() => { });
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActivePiece(event.active.id as string);
        setSelectedPos(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActivePiece(null);
        if (over && active.id !== over.id) {
            const from = active.id as string;
            const to = over.id as string;
            const piece = getPieceAt(from);
            const target = getPieceAt(to);

            if (piece && (!validationEnabled || (piece.color === "white" ? "w" : "b") === currentTurn)) {
                if (target && target.color === piece.color && validationEnabled) return;
                if (!checkMoveLegal(from, to)) return;

                if (isPromotionMove(from, to)) {
                    setPromotionPending({ from, to });
                } else {
                    executeMove(from, to);
                }
            }
        }
    };

    const handlePieceSelect = (pos: string) => {
        if (selectedPos === pos) return setSelectedPos(null);
        if (selectedPos) {
            const piece = getPieceAt(selectedPos);
            const target = getPieceAt(pos);
            if (piece && (!validationEnabled || (piece.color === "white" ? "w" : "b") === currentTurn)) {
                if (target && target.color === piece.color && validationEnabled) return setSelectedPos(pos);

                // Add validation for click-to-move
                if (!checkMoveLegal(selectedPos, pos)) return;

                if (isPromotionMove(selectedPos, pos)) {
                    setPromotionPending({ from: selectedPos, to: pos });
                } else {
                    executeMove(selectedPos, pos);
                }
            }
        } else {
            const piece = getPieceAt(pos);
            if (piece && (piece.color === "white" ? "w" : "b") === currentTurn) {
                setSelectedPos(pos);
            }
        }
    };

    // Render
    const activeKeys = new Set(board.activeSquares.map(s => `${s.col},${s.row}`));

    const boardContent = [];
    for (let row = 0; row < board.rows; row++) {
        for (let col = 0; col < board.cols; col++) {
            const pos = `${col},${row}`;
            if (!activeKeys.has(pos)) {
                boardContent.push(<div key={pos} style={{ width: blockSize, height: blockSize }} />);
                continue;
            }

            const isWhite = (row + col) % 2 === 0;
            const displayPiece = getPieceAt(pos);
            if (displayPiece) displayPiece.size = blockSize * 0.8;

            boardContent.push(
                <SquareTile
                    key={pos}
                    pos={pos}
                    isWhite={isWhite}
                    piece={displayPiece}
                    blockSize={blockSize}
                    selected={selectedPos === pos}
                    isMoveFrom={lastMoveFrom === pos}
                    isMoveTo={lastMoveTo === pos}
                    onClick={handlePieceSelect}
                    onContextMenu={(p) => {
                        setRedMarkedSquares(prev => {
                            const next = new Set(prev);
                            if (next.has(p)) next.delete(p);
                            else next.add(p);
                            return next;
                        });
                    }}
                    boardStyle="v3"
                    isTurn={displayPiece ? (displayPiece.color === "white" ? "w" : "b") === currentTurn : false}
                    squareRefs={squareRefs}
                />
            );
        }
    }

    const markerOverlay = Array.from(redMarkedSquares).map(pos => {
        const el = squareRefs.current[pos];
        if (!el) return null;
        return (
            <div
                key={`red-${pos}`}
                className="absolute z-10 pointer-events-none bg-red-500/40 rounded-sm"
                style={{
                    width: blockSize,
                    height: blockSize,
                    left: el.offsetLeft,
                    top: el.offsetTop,
                    boxShadow: 'inset 0 0 15px rgba(239, 68, 68, 0.4)'
                }}
            />
        );
    });

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-4 mb-6 px-6 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                <button
                    onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5 active:scale-95"
                >
                    <Minus size={18} />
                </button>
                <div className="flex flex-col items-center min-w-[60px]">
                    <span className="text-[9px] text-white/40 uppercase font-bold mb-0.5 tracking-widest">{t('zoom')}</span>
                    <span className="text-sm font-bold text-white tabular-nums">{Math.round(zoom * 100)}%</span>
                </div>
                <button
                    onClick={() => setZoom(prev => Math.min(2.5, prev + 0.1))}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5 active:scale-95"
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="relative shadow-2xl rounded-lg border-6 border-stone-800 bg-stone-800">
                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: `repeat(${board.cols}, ${blockSize}px)`,
                        gridTemplateRows: `repeat(${board.rows}, ${blockSize}px)`,
                    }}
                >
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                        {boardContent}
                        {markerOverlay}
                        <DragOverlay dropAnimation={null}>
                            {activePiece && (() => {
                                const p = getPieceAt(activePiece);
                                if (!p) return null;
                                return (
                                    <div style={{ width: blockSize, height: blockSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Image src={getPieceImage("v3", p.color, p.type)} alt="" width={blockSize} height={blockSize} unoptimized style={{ pointerEvents: "none" }} />
                                    </div>
                                );
                            })()}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            {/* Premium Validation Toggle */}
            <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${!validationEnabled ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-white/20'}`}>
                        {t('noValidation')}
                    </span>

                    <motion.button
                        onClick={toggleValidation}
                        animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`relative w-16 h-8 rounded-full transition-all duration-500 flex items-center p-1.5 shadow-inner ${validationEnabled ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-white/10'}`}
                    >
                        <motion.div
                            animate={{ x: validationEnabled ? 32 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="w-5 h-5 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.2)] flex items-center justify-center relative z-10"
                        >
                            {validationEnabled ?
                                <Shield size={10} className="text-blue-600" /> :
                                <ShieldOff size={10} className="text-stone-400" />
                            }
                        </motion.div>
                        {validationEnabled && (
                            <motion.div
                                layoutId="glow"
                                className="absolute inset-0 bg-blue-400/20 blur-md rounded-full"
                            />
                        )}
                    </motion.button>

                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${validationEnabled ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-white/20'}`}>
                        {t('validation')}
                    </span>
                </div>

                <AnimatePresence>
                    {showKingWarning && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center gap-2 text-red-400 text-[11px] font-medium bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20"
                        >
                            <AlertCircle size={14} />
                            {t('kingWarning')}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Promotion Modal */}
            <AnimatePresence>
                {promotionPending && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#262421] p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center gap-6"
                        >
                            <h3 className="text-white font-bold text-lg tracking-tight">{t('choosePromotion')}</h3>
                            <div className="flex gap-4">
                                {['queen', 'rook', 'bishop', 'knight'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            executeMove(promotionPending.from, promotionPending.to, type);
                                            setPromotionPending(null);
                                        }}
                                        className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/20 active:scale-95 flex items-center justify-center p-2"
                                    >
                                        <PieceRenderer
                                            type={type}
                                            color={getPieceAt(promotionPending.from)?.color || "white"}
                                            size={48}
                                            boardStyle="v3"
                                        />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
