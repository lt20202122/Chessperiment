"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    TouchSensor
} from '@dnd-kit/core';
import { BoardClass } from '@/engine/board';
import { Piece } from '@/engine/piece';
import PlaySidebar from './PlaySidebar';
import PieceRenderer from './PieceRenderer';
import { Project } from '@/types/Project';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// --- Board Styles (Inline to avoid file issues) ---
const boardStyles = {
    whiteSquare: { backgroundColor: '#ffffff', color: '#111' },
    blackSquare: { backgroundColor: '#769656', color: '#fff' },
    moveFrom: { boxShadow: 'inset 0 0 0 4px rgba(255, 255, 0, 0.9)', backgroundColor: 'rgba(255, 255, 0, 0.4)' },
    moveTo: { boxShadow: 'inset 0 0 0 4px rgba(255, 165, 0, 0.9)', backgroundColor: 'rgba(255, 165, 0, 0.4)' }
};

// --- Draggable Piece Component ---
const DraggablePiece = ({ piece, size, disabled, onContextMenu, scale = 1 }: { piece: Piece, size: number, disabled: boolean, onContextMenu?: () => void, scale?: number }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: piece.position,
        data: piece,
        disabled: disabled
    });

    const style: React.CSSProperties = {
        width: size,
        height: size,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: isDragging ? 50 : 10,
        opacity: isDragging ? 0 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        cursor: disabled ? 'default' : 'grab',
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(); }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'center', width: '100%', height: '100%' }}>
                <PieceRenderer
                    type={piece.type}
                    color={piece.color}
                    size={size}
                    pixels={(piece as any).isCustom ? (piece.color === 'white' ? (piece as any).pixelsWhite : (piece as any).pixelsBlack) : undefined}
                    image={(piece as any).image} // Support image property if it exists on custom piece
                    variables={(piece as any).variables}
                    hasLogic={(piece as any).isCustom}
                />
            </div>
        </div>
    );
};

// --- Square Component ---
const SquareTile = ({
    pos,
    isBlack,
    size,
    piece,
    isMoveFrom,
    isMoveTo,
    onSquareClick,
    disabled,
    isValidating
}: {
    pos: string,
    isBlack: boolean,
    size: number,
    piece: Piece | null,
    isMoveFrom: boolean,
    isMoveTo: boolean,
    onSquareClick: (pos: string) => void,
    disabled: boolean,
    isValidating: boolean
}) => {
    const { setNodeRef, isOver } = useDroppable({ id: pos });

    const baseStyle = isBlack ? boardStyles.blackSquare : boardStyles.whiteSquare;
    const moveStyle = isMoveFrom ? boardStyles.moveFrom : (isMoveTo ? boardStyles.moveTo : {});

    // Highlight legitimate drag targets (optional, maybe cleaner without)
    const highlightStyle = isOver && !piece ? { boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.5)' } : {};

    return (
        <div
            ref={setNodeRef}
            style={{
                width: size,
                height: size,
                ...baseStyle,
                ...moveStyle,
                ...highlightStyle,
                position: 'relative'
            }}
            className="flex items-center justify-center"
            onClick={() => onSquareClick(pos)}
        >
            {/* Coordinate Label (optional, could be added) */}

            {piece && (
                <DraggablePiece
                    piece={piece}
                    size={size}
                    disabled={disabled}
                    // Scale down slightly for visual breath
                    scale={0.9}
                />
            )}
        </div>
    );
};

// --- Main Component ---
interface PlayBoardProps {
    project: Project;
    projectId: string; // Kept for consistency if needed
}

export default function PlayBoard({ project, projectId }: PlayBoardProps) {
    const router = useRouter();

    // -- Board Logic & State --
    const [board, setBoard] = useState<BoardClass | null>(null);
    const [pieces, setPieces] = useState<Piece[]>([]); // Derived from board for rendering
    const [generation, setGeneration] = useState(0); // To force re-render
    const [history, setHistory] = useState<{ from: string, to: string, notation?: string }[]>([]);
    const [moveHistoryIndex, setMoveHistoryIndex] = useState(-1);
    const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
    const [capturedBlack, setCapturedBlack] = useState<string[]>([]);

    // -- View State --
    const [blockSize, setBlockSize] = useState(80);
    const containerRef = useRef<HTMLDivElement>(null);

    // -- Interaction State --
    const [activeDragId, setActiveDragId] = useState<string | null>(null); // dragging piece from square ID
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [lastMove, setLastMove] = useState<{ from: string, to: string } | null>(null);

    // -- Options --
    const [validateMoves, setValidateMoves] = useState(true);

    // -- Sensors --
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
    );

    // Initialize Board
    useEffect(() => {
        if (!project) return;

        try {
            // Reconstruct the board from project data
            const {
                rows = 8,
                cols = 8,
                placedPieces = {},
                activeSquares = [],
                customPieces = []
            } = project;

            // Build custom prototype map
            const protoMap = new Map();
            customPieces.forEach(p => protoMap.set(p.name, p));

            // Create squares map for board constructor
            const initialSquares: Record<string, Piece | null> = {};

            // Populate board
            Object.entries(placedPieces).forEach(([sq, pData]: [string, any]) => {
                if (activeSquares.length > 0 && !activeSquares.includes(sq)) return;

                const pieceId = `${sq}_${pData.color}_${pData.type}`;
                let newPiece: Piece;

                // Check if custom
                const customProto = customPieces.find(cp => cp.name === pData.type);
                if (customProto) {
                    newPiece = Piece.create(
                        pieceId,
                        pData.type,
                        pData.color,
                        sq,
                        customProto.logic || [], // Rules
                        [] // Logic (Trigger based) - assuming 'logic' in proto is generic rules
                    );

                    // Assign extra properties
                    if ((customProto as any).variables) (newPiece as any).variables = (customProto as any).variables;
                    (newPiece as any).isCustom = true; // Ensure it's treated as custom
                    (newPiece as any).pixelsWhite = customProto.pixelsWhite;
                    (newPiece as any).pixelsBlack = customProto.pixelsBlack;
                    (newPiece as any).image = customProto.color === 'white' ? customProto.imageWhite : customProto.imageBlack;

                } else {
                    newPiece = Piece.create(pieceId, pData.type, pData.color, sq);
                }

                if (newPiece) {
                    initialSquares[sq] = newPiece;
                }
            });

            const newBoard = new BoardClass(
                initialSquares,
                activeSquares.length > 0 ? activeSquares : undefined,
                cols,
                rows,
                project.gridType || 'square'
            );

            setBoard(newBoard);
            updateView(newBoard);
        } catch (err) {
            console.error("Failed to initialize board:", err);
            toast.error("Failed to load board configuration");
        }
    }, [project]);

    // Responsive Board Size
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && board) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const padding = 40;
                const availableSize = Math.min(width, height) - padding;
                const maxDim = Math.max(board.width, board.height);
                setBlockSize(Math.floor(availableSize / maxDim));
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial

        // Polling for container readiness
        const interval = setInterval(handleResize, 500);
        return () => { window.removeEventListener('resize', handleResize); clearInterval(interval); };
    }, [board]);

    const updateView = (currentBoard: BoardClass) => {
        const allSquares = currentBoard.getSquares();
        const pList = Object.values(allSquares).filter(p => p !== null) as Piece[];
        setPieces(pList);
        setGeneration(prev => prev + 1);

        // Update history view
        const rawHistory = currentBoard.getHistory();
        // Just take distinct moves for now, simplistic approach
        // We really want to parse this better, but for now:
        const prettyHistory = rawHistory.map(m => ({
            from: m.from,
            to: m.to,
            notation: `${m.from.toUpperCase()} → ${m.to.toUpperCase()}`
        }));
        setHistory(prettyHistory);
        setMoveHistoryIndex(prettyHistory.length - 1);
    };

    const handleSquareClick = (pos: string) => {
        if (!board) return;

        // If something selected, try to move
        if (selectedSquare) {
            if (pos === selectedSquare) {
                // Deselect
                setSelectedSquare(null);
                return;
            }

            // Attempt Move
            performMove(selectedSquare, pos);
            setSelectedSquare(null);
        } else {
            // Select if has piece and correct turn
            const piece = board.getPiece(pos);
            if (piece) {
                // Determine turn
                // BoardClass doesn't enforce turn in movePiece directly unless we check it
                // We should respect turns for the "Game" feel
                if (piece.color === board.getTurn()) {
                    setSelectedSquare(pos);
                }
            }
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
        setSelectedSquare(event.active.id as string); // Selecting source visually
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        setSelectedSquare(null);

        if (!over || !board) return;

        const from = active.id as string;
        const to = over.id as string;

        if (from === to) return;

        performMove(from, to);
    };

    const performMove = (from: string, to: string) => {
        if (!board) return;

        const piece = board.getPiece(from);
        if (!piece) return;

        // Turn check
        if (piece.color !== board.getTurn()) {
            toast.error(`It's ${board.getTurn()}'s turn!`);
            return;
        }

        // Validate
        if (validateMoves) {
            const isValid = piece.isValidMove(piece.position, to, board);
            if (!isValid) {
                // Try to see if it's an attack
                const isAttack = piece.canAttack(to, board);
                if (!isAttack) {
                    // Check if it's a promotion etc handled by engine...
                    // Actually BoardClass.movePiece doesn't auto-validate "logic" 
                    // It performs it. We should use piece.isValidMove first.

                    // Play "illegal" sound or shake?
                    return;
                }
            }
        }

        // Capture logic for UI
        const destinationPiece = board.getPiece(to);
        const isCapture = destinationPiece && destinationPiece.color !== piece.color;
        const capturedType = destinationPiece ? destinationPiece.type : null;

        // Execute
        const success = board.movePiece(from, to);
        if (success) {
            if (isCapture && capturedType) {
                if (piece.color === 'white') {
                    setCapturedWhite(prev => [...prev, capturedType]);
                } else {
                    setCapturedBlack(prev => [...prev, capturedType]);
                }
            }
            setLastMove({ from, to });
            new Audio("/sounds/move-self.mp3").play().catch(() => { });
            updateView(board);
        } else {
            toast.error("Move prevented by game rules");
        }
    };

    const handleReset = () => {
        if (board && project) {
            // Re-mount logic by essentially forcing a reload or re-running init
            // For now, reload window is safest to reset all internal state (logic chunks etc)
            window.location.reload();
        }
    };

    // --- Render ---
    if (!board) return (
        <div className="flex h-screen items-center justify-center bg-stone-900 text-white">
            <Loader2 className="animate-spin" />
            <span className="ml-2">Initializing Board...</span>
        </div>
    );

    const activeDragPiece = activeDragId ? board.getPiece(activeDragId) : null;

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-stone-950 text-stone-100 overflow-hidden font-sans">

            {/* Left/Top Area: Board */}
            <div className="flex-1 relative flex flex-col">

                {/* Header / Toolbar */}
                <div className="h-16 flex items-center px-6 border-b border-stone-800 bg-stone-900 z-20 justify-between">
                    <button onClick={() => router.push(`/editor/${projectId}`)} className="flex items-center gap-2 text-stone-400 hover:text-white transition">
                        <ArrowLeft size={20} />
                        <span>Back to Editor</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${validateMoves ? 'bg-green-500' : 'bg-stone-600'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${validateMoves ? 'translate-x-4' : ''}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={validateMoves} onChange={e => setValidateMoves(e.target.checked)} />
                            <span className="text-sm font-medium text-stone-300">Validate Moves</span>
                        </label>
                    </div>
                </div>

                {/* Board Container */}
                <div className="flex-1 flex items-center justify-center bg-stone-900/50 p-4" ref={containerRef}>
                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${board.width}, ${blockSize}px)`,
                                gridTemplateRows: `repeat(${board.height}, ${blockSize}px)`,
                            }}
                            className="bg-stone-800 shadow-2xl rounded-sm overflow-hidden border-8 border-stone-800"
                        >
                            {/* Render Squares */}
                            {Array.from({ length: board.height }).map((_, r) => (
                                Array.from({ length: board.width }).map((_, c) => {
                                    // Normally Y=0 is bottom in math but top in arrays
                                    // BoardClass: (0,0) is usually top-left for arrays?
                                    // Let's assume standard array mapping for now: (col, row)
                                    // But check BoardClass implementation. setupInitialBoard:
                                    // squares[`${file}2`] -> white pawn.
                                    // if file is 'a', it's col 0. '2' is row index... 1?
                                    // We need to map visual row to coordinate.
                                    // Visual Row 0 is Top.
                                    // Standard algebraic: Rank 8 is Top. Rank 1 is Bottom.
                                    // So Row 0 -> Rank 8 (y=7 in 0-indexed if 0 is Bottom)
                                    // OR Row 0 -> Rank 8 (y=0 in 0-indexed if 0 is Top)

                                    // In BoardClass: a1 is white rook.
                                    // setupInitialBoard -> a1 is squares['a1'].
                                    // toCoords('a1') -> [0, 0] usually if 0,0 is bottom-left? or top-left?
                                    // helper `toCoords` in `engine/utils.ts`.
                                    // Let's assume standard Grid rendering:
                                    // Usually we render Row 0 at Top.
                                    // If 'a1' is Bottom-Left, then Row (Height-1) is '1'.

                                    // Let's render Top to Bottom (visual rows).
                                    // Visual Row 0 corresponds to Y = (Height - 1 - r) if Y=0 is Bottom.
                                    // OR Y = r if Y=0 is Top.

                                    // Let's assume standard Chess conventions:
                                    // Rank 8 (Top) is Y=7 (if 0-indexed bottom-up) or Y=0 (if top-down).
                                    // Chess.js uses top-down usually? 
                                    // Let's use the file/rank generation logic from BoardClass for consistency if possible, 
                                    // but we are iterating grid cells.

                                    // Default Assumption: 
                                    // y=0 is BOTTOM (Rank 1). y=7 is TOP (Rank 8).
                                    // So visual row r=0 is y=7.
                                    // visual row r=7 is y=0.

                                    const y = board.height - 1 - r;
                                    const x = c;

                                    const file = String.fromCharCode('a'.charCodeAt(0) + x);
                                    const rank = y + 1;
                                    const pos = `${file}${rank}`; // e.g. "a8"

                                    // Check if active
                                    if (project.activeSquares && project.activeSquares.length > 0 && !project.activeSquares.includes(pos)) {
                                        return <div key={pos} style={{ width: blockSize, height: blockSize }} className="bg-transparent" />;
                                    }

                                    const piece = board.getPiece(pos);
                                    const isBlackSquare = (x + y) % 2 === 0; // Standard chess coloring (a1 is black? No, a1 is black... wait. a1 is (0,0). 0+0=0 even -> Black? Actually a1 is Dark.)

                                    return (
                                        <SquareTile
                                            key={pos}
                                            pos={pos}
                                            isBlack={isBlackSquare}
                                            size={blockSize}
                                            piece={piece}
                                            isMoveFrom={lastMove?.from === pos}
                                            isMoveTo={lastMove?.to === pos}
                                            onSquareClick={handleSquareClick}
                                            disabled={false}
                                            isValidating={validateMoves}
                                        />
                                    );
                                })
                            ))}
                        </div>

                        <DragOverlay>
                            {activeDragPiece ? (
                                <div style={{ width: blockSize, height: blockSize }}>
                                    <PieceRenderer
                                        type={activeDragPiece.type}
                                        color={activeDragPiece.color}
                                        size={blockSize}
                                        pixels={(activeDragPiece as any).isCustom ? (activeDragPiece.color === 'white' ? (activeDragPiece as any).pixelsWhite : (activeDragPiece as any).pixelsBlack) : undefined}
                                        image={(activeDragPiece as any).image}
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            {/* Right Area: Sidebar */}
            <PlaySidebar
                myColor="white" // Always viewing as "Primary" local user
                gameStatus="playing"
                gameInfo=""
                moveHistory={history}
                historyIndex={moveHistoryIndex}
                navigateHistory={() => { }} // Local history nav TODO
                exitHistoryView={() => { }}
                isViewingHistory={false}
                onResign={() => { }}
                onOfferDraw={() => { }}
                onReset={handleReset}
                gameMode="local"
                currentTurn={board.getTurn()}
                onMoveClick={() => { }}
                capturedByWhite={capturedWhite} // Logic for captures not yet fully hooked up in board helper, leaving empty for now
                capturedByBlack={capturedBlack}
                boardPieces={pieces}
            />

        </div>
    );
}
