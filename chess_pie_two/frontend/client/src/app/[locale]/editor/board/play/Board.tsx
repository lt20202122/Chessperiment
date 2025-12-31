"use client";
import React, { useState, useEffect, useRef, memo } from "react";
import Image from "next/image";
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
import "../../../game/Board.css";
import { type Square } from '@/engine/types'
import { Game } from '@/engine/game'
import { BoardClass } from "@/engine/board";
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
            <Image
                src={getPieceImage(boardStyle, piece.color, piece.type)}
                alt={`${piece.color} ${piece.type}`}
                height={piece.size}
                width={piece.size}
                unoptimized
                className="bg-transparent"
                style={{ height: size, width: "auto", pointerEvents: "none" }}
                priority
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
            onContextMenu={(e) => e.preventDefault()}
        >
            {piece && <DraggablePiece piece={piece} size={piece.size ?? blockSize * 0.8} isTurn={isTurn} onClick={() => onClick(pos)} boardStyle={boardStyle} />}
        </div>
    );
});

// --- Board Component ---
export default function Board({ board }: { board: CustomBoard }) {
    const [game] = useState(new Game);
    const [boardObj, setBoardObj] = useState<BoardClass>(game.getBoard());
    const [boardPieces, setBoardPieces] = useState<(PlacedPiece & { position: string })[]>([]);
    const [currentTurn, setCurrentTurn] = useState<"w" | "b">("w");
    const [blockSize, setBlockSize] = useState(80);
    const [selectedPos, setSelectedPos] = useState<string | null>(null);
    const [activePiece, setActivePiece] = useState<string | null>(null);
    const [lastMoveFrom, setLastMoveFrom] = useState<string | null>(null);
    const [lastMoveTo, setLastMoveTo] = useState<string | null>(null);

    const squareRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    const isLegal = (from: Square, to: Square) => {
        console.log("isLegal called");
        if (game.makeMove(from, to)) {
            console.log("legal move");
            return true;
        }
        console.log("illegal move");
        return false;
    }

    useEffect(() => {
        // Convert placedPieces record to array with position
        const piecesArray: (PlacedPiece & { position: string })[] = Object.entries(board.placedPieces).map(
            ([pos, piece]) => ({ ...piece, position: pos })
        );
        setBoardPieces(piecesArray);
    }, [board]);

    // Resize
    useEffect(() => {
        const updateSize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const availableWidth = w * 0.95;
            const availableHeight = h * 0.85;
            const maxBoardSize = Math.min(availableWidth, availableHeight);
            const newBlockSize = Math.floor(maxBoardSize / board.cols);
            setBlockSize(Math.max(Math.min(newBlockSize, 80), 30));
        };
        window.addEventListener("resize", updateSize);
        updateSize();
        return () => window.removeEventListener("resize", updateSize);
    }, [board.cols]);

    const getPieceAt = (pos: string) => boardPieces.find((p) => p.position === pos);

    const executeMove = (from: string, to: string) => {
        const movingPiece = getPieceAt(from);
        if (!movingPiece) return;

        let newPieces = boardPieces.filter((p) => p.position !== from && p.position !== to);
        const updatedPiece = { ...movingPiece, position: to };
        newPieces.push(updatedPiece);
        setBoardPieces(newPieces);

        setCurrentTurn(currentTurn === "w" ? "b" : "w");
        setLastMoveFrom(from);
        setLastMoveTo(to);
        setSelectedPos(null);

        const audio = new Audio("/sounds/move-self.mp3");
        audio.play().catch(() => { });
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

            if (piece && (piece.color === "white" ? "w" : "b") === currentTurn) {
                if (target && target.color === piece.color) return;
                console.log("isLegal called from handleDragEnd");
                if (!isLegal(from as Square, to as Square)) return;
                executeMove(from, to);
            }
        }
    };

    const handlePieceSelect = (pos: string) => {
        if (selectedPos === pos) return setSelectedPos(null);
        if (selectedPos) {
            const piece = getPieceAt(selectedPos);
            const target = getPieceAt(pos);
            if (piece && (piece.color === "white" ? "w" : "b") === currentTurn) {
                if (target && target.color === piece.color) return setSelectedPos(pos);
                executeMove(selectedPos, pos);
            }
        } else {
            const piece = getPieceAt(pos);
            if (piece && (piece.color === "white" ? "w" : "b") === currentTurn) {
                setSelectedPos(pos);
            }
        }
    };

    // Render
    // activeKeys Set for O(1) lookup
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
                    boardStyle="v3"
                    isTurn={displayPiece ? (displayPiece.color === "white" ? "w" : "b") === currentTurn : false}
                    squareRefs={squareRefs}
                />
            );
        }
    }

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative shadow-2xl rounded-lg border-4 border-stone-800 bg-stone-800">
                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: `repeat(${board.cols}, ${blockSize}px)`,
                        gridTemplateRows: `repeat(${board.rows}, ${blockSize}px)`,
                    }}
                >
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                        {boardContent}
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
        </div>
    );
}
