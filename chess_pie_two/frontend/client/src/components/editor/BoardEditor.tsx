'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, GripHorizontal, Plus, X, Minus, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';
import { getPieceImage } from '@/app/[locale]/game/Data';
import { EditMode } from '@/app/[locale]/editor/board/PageClient';
import PieceRenderer from '@/components/game/PieceRenderer';

// Utils to convert x,y to string key
const toKey = (x: number, y: number) => `${x},${y}`;

const getPieceScale = (type: string) => {
    switch (type.toLowerCase()) {
        case 'king': return 0.7;
        case 'queen': return 0.9;
        case 'bishop': return 0.45;
        case 'knight': return 0.78;
        case 'rook': return 0.82;
        case 'pawn': return 0.71;
        default: return 0.85;
    }
};

interface BoardEditorProps {
    editMode: EditMode;
    selectedPiece: { type: string, color: string };
    boardStyle: string;
    generateBoardData: (rows: number, cols: number, activeSquares: Set<string>, placedPieces: Record<string, { type: string; color: string }>) => void;
    customCollection: Record<string, any>;
}

// --- Memoized Square Component ---
const EditorSquare = React.memo(({
    x, y,
    isActive,
    isBlackSquare,
    piece,
    editMode,
    selectedPiece,
    boardStyle,
    squareSize,
    onMouseDown,
    onMouseEnter,
    onContextMenu,
    customCollection
}: {
    x: number, y: number,
    isActive: boolean,
    isBlackSquare: boolean,
    piece?: { type: string, color: string },
    editMode: string,
    selectedPiece: { type: string, color: string },
    boardStyle: string,
    squareSize: number,
    onMouseDown: (x: number, y: number, e: React.MouseEvent) => void,
    onMouseEnter: (x: number, y: number) => void,
    onContextMenu: (x: number, y: number, e: React.MouseEvent) => void,
    customCollection?: Record<string, any>
}) => {
    const customPiece = piece ? (customCollection?.[piece.type] || Object.values(customCollection || {}).find((p: any) => p.name === piece.type)) : undefined;
    const pixels = customPiece?.pixels;

    return (
        <div
            style={{ width: squareSize, height: squareSize }}
            className={`
                relative flex items-center justify-center group transition-colors duration-150
                ${isActive
                    ? (isBlackSquare ? 'bg-[#779954]' : 'bg-[#e9edcc]')
                    : 'bg-gray-300/10 border border-gray-400/20 border-dashed hover:border-accent hover:bg-accent/10 cursor-pointer'}
                ${editMode === 'pieces' && isActive ? 'cursor-cell' : ''}
            `}
            onContextMenu={(e) => onContextMenu(x, y, e)}
            onMouseDown={(e) => onMouseDown(x, y, e)}
            onMouseEnter={() => onMouseEnter(x, y)}
        >
            {/* Piece rendering */}
            {isActive && piece && (
                <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none transform transition-transform group-hover:scale-105">
                    <PieceRenderer
                        type={customPiece ? customPiece.name : piece.type}
                        color={piece.color}
                        size={squareSize * getPieceScale(piece.type)}
                        boardStyle={boardStyle}
                        className="drop-shadow-lg"
                        pixels={pixels}
                    />
                </div>
            )}

            {/* Edit Mode HUD overlay */}
            {editMode === 'shape' && (
                <>
                    {!isActive && (
                        <Plus className="text-accent opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100" size={24} />
                    )}
                    {isActive && !piece && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-500/10 transition-all rounded-sm">
                            <X className="text-red-500 drop-shadow-md" size={32} strokeWidth={3} />
                        </div>
                    )}
                </>
            )}

            {editMode === 'pieces' && isActive && !piece && (
                <div className="opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
                    <PieceRenderer
                        type={selectedPiece.type}
                        color={selectedPiece.color}
                        size={squareSize * getPieceScale(selectedPiece.type)}
                        boardStyle={boardStyle}
                    />
                </div>
            )}
        </div>
    );
});

export default function BoardEditor({ editMode, selectedPiece, boardStyle, generateBoardData, customCollection }: BoardEditorProps) {
    const [rows, setRows] = useState<number>(() => Number(localStorage.getItem('rows') || 8));
    const [cols, setCols] = useState<number>(() => Number(localStorage.getItem('cols') || 8));
    const [placedPieces, setPlacedPieces] = useState<Record<string, { type: string; color: string, size: number }>>(() => {
        try {
            return JSON.parse(localStorage.getItem('placedPieces') || '{}');
        } catch {
            return {};
        }
    });

    const [activeSquares, setActiveSquares] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem('activeSquares');
            if (stored) return new Set(JSON.parse(stored));
        } catch { }
        return new Set();
    });

    // --- History for Undo/Redo ---
    const [history, setHistory] = useState<{
        placedPieces: Record<string, { type: string; color: string, size: number }>;
        activeSquares: Set<string>;
        rows: number;
        cols: number;
    }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const saveToHistory = (
        pPieces: Record<string, { type: string; color: string, size: number }>,
        aSquares: Set<string>,
        r: number,
        c: number
    ) => {
        const newState = {
            placedPieces: JSON.parse(JSON.stringify(pPieces)),
            activeSquares: new Set(aSquares),
            rows: r,
            cols: c
        };

        setHistory(prev => {
            const next = prev.slice(0, historyIndex + 1);
            next.push(newState);
            if (next.length > 50) next.shift(); // Max 50 undos
            return next;
        });
        setHistoryIndex(prev => {
            const next = prev + 1;
            return next > 49 ? 49 : next;
        });
    };

    const undo = () => {
        if (historyIndex <= 0) return;
        const prevState = history[historyIndex - 1];
        setPlacedPieces(prevState.placedPieces);
        setActiveSquares(new Set(prevState.activeSquares));
        setRows(prevState.rows);
        setCols(prevState.cols);
        setHistoryIndex(prev => prev - 1);
    };

    const redo = () => {
        if (historyIndex >= history.length - 1) return;
        const nextState = history[historyIndex + 1];
        setPlacedPieces(nextState.placedPieces);
        setActiveSquares(new Set(nextState.activeSquares));
        setRows(nextState.rows);
        setCols(nextState.cols);
        setHistoryIndex(prev => prev + 1);
    };

    // Initial history
    useEffect(() => {
        if (history.length === 0) {
            saveToHistory(placedPieces, activeSquares, rows, cols);
        }
    }, []);

    const [zoom, setZoom] = useState(1);
    const [isPainting, setIsPainting] = useState(false);
    const [isRightClickPainting, setIsRightClickPainting] = useState(false);
    const [paintValue, setPaintValue] = useState<boolean | null>(null); // For shape mode: true=activate, false=deactivate
    const paintValueRef = useRef<boolean | null>(null);
    const isPaintingRef = useRef(false);
    const isRightClickPaintingRef = useRef(false);

    useEffect(() => { paintValueRef.current = paintValue; }, [paintValue]);
    useEffect(() => { isPaintingRef.current = isPainting; }, [isPainting]);
    useEffect(() => { isRightClickPaintingRef.current = isRightClickPainting; }, [isRightClickPainting]);

    const containerRef = useRef<HTMLDivElement>(null);


    // Refs for stable state access in event listeners
    const rowsRef = useRef(rows);
    const colsRef = useRef(cols);
    const activeSquaresRef = useRef(activeSquares);
    const squareSizeRef = useRef(70);
    const placedPiecesRef = useRef(placedPieces);

    useEffect(() => { rowsRef.current = rows; }, [rows]);
    useEffect(() => { colsRef.current = cols; }, [cols]);
    useEffect(() => { activeSquaresRef.current = activeSquares; }, [activeSquares]);
    // squareSizeRef updated via currentSquareSize effect below
    useEffect(() => { placedPiecesRef.current = placedPieces; }, [placedPieces]);

    useEffect(() => {
        if (activeSquares.size === 0) {
            const newSet = new Set<string>();
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    newSet.add(toKey(x, y));
                }
            }
            setActiveSquares(newSet);
        }
    }, [rows, cols, activeSquares.size]);

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('rows', rows.toString());
            localStorage.setItem('cols', cols.toString());
            localStorage.setItem('placedPieces', JSON.stringify(placedPieces));
            localStorage.setItem('activeSquares', JSON.stringify(Array.from(activeSquares)));

            generateBoardData(rows, cols, activeSquares, placedPieces);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [rows, cols, placedPieces, activeSquares, generateBoardData]);

    const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });
    useEffect(() => {
        if (typeof window === 'undefined') return;
        setWindowSize({ w: window.innerWidth, h: window.innerHeight });
        const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const calculateSquareSize = useCallback((r: number, c: number, z: number, winW: number, winH: number) => {
        const isLarge = winW >= 1024;
        const availableWidth = isLarge ? winW - 420 : winW - 48;
        const availableHeight = isLarge ? winH - 180 : winH * 0.45;
        const widthBasedSize = Math.floor(availableWidth / (c + 1));
        const heightBasedSize = Math.floor(availableHeight / (r + 1));
        return Math.max(28, Math.min(widthBasedSize, heightBasedSize, 70)) * z;
    }, []);

    const currentSquareSize = calculateSquareSize(rows, cols, zoom, windowSize.w, windowSize.h);
    const SQUARE_SIZE = currentSquareSize;

    useEffect(() => {
        squareSizeRef.current = currentSquareSize;
    }, [currentSquareSize]);

    // Keybinds for Zoom & Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            } else if (e.key === '+' || e.key === '=') {
                setZoom(prev => Math.min(2.5, prev + 0.1));
            } else if (e.key === '-' || e.key === '_') {
                setZoom(prev => Math.max(0.3, prev - 0.1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, historyIndex]); // Depend on history for undo/redo functions to be fresh



    // Resizing logic
    const resizingRef = useRef<'top' | 'bottom' | 'left' | 'right' | null>(null);
    const startPosRef = useRef<{ x: number, y: number } | null>(null);
    const startDimRef = useRef<{ rows: number, cols: number } | null>(null);

    // Unified pointer handling for both mouse and touch
    const getPointerPosition = (e: MouseEvent | TouchEvent) => {
        if ('touches' in e && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };

    const handlePointerDown = (type: 'top' | 'bottom' | 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        resizingRef.current = type;
        const pos = getPointerPosition(e.nativeEvent as any);
        startPosRef.current = pos;
        startDimRef.current = { rows, cols };

        document.addEventListener('mousemove', handlePointerMove);
        document.addEventListener('mouseup', handlePointerUp);
        document.addEventListener('touchmove', handlePointerMove);
        document.addEventListener('touchend', handlePointerUp);
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        if (!resizingRef.current || !startPosRef.current || !startDimRef.current) return;

        const pos = getPointerPosition(e);
        const dx = pos.x - startPosRef.current.x;
        const dy = pos.y - startPosRef.current.y;

        // Helper to update active squares when growing
        const activateNewSquares = (newCols: number, newRows: number) => {
            setActiveSquares(prev => {
                const next = new Set(prev);
                // Add newly visible area
                for (let x = 0; x < newCols; x++) {
                    for (let y = 0; y < newRows; y++) {
                        // If it's outside the old bounds, add it
                        if (x >= startDimRef.current!.cols || y >= startDimRef.current!.rows || resizingRef.current === 'left' || resizingRef.current === 'top') {
                            // Ideally, we just ensure everything in range is active if we are expanding?
                            // But logic specific to direction:
                        }
                        // Actually, simplified logic: just ensure the NEW squares are active?
                        // The original logic was directional. Let's stick to simple "add active" logic based on new bounds? 
                        // But we want to preserve "inactive" squares.
                        // Let's use the original logic pattern per direction.
                    }
                }
                return next;
            });
        };

        if (resizingRef.current === 'right') {
            const addedCols = Math.floor(dx / squareSizeRef.current);
            const newCols = Math.max(1, Math.min(20, startDimRef.current.cols + addedCols));
            if (newCols !== colsRef.current) {
                if (newCols > colsRef.current) {
                    setActiveSquares(prev => {
                        const next = new Set(prev);
                        for (let x = colsRef.current; x < newCols; x++) {
                            for (let y = 0; y < rowsRef.current; y++) next.add(toKey(x, y));
                        }
                        return next;
                    });
                }
                setCols(newCols);
            }
        } else if (resizingRef.current === 'bottom') {
            const addedRows = Math.floor(dy / squareSizeRef.current);
            const newRows = Math.max(1, Math.min(20, startDimRef.current.rows + addedRows));
            if (newRows !== rowsRef.current) {
                if (newRows > rowsRef.current) {
                    setActiveSquares(prev => {
                        const next = new Set(prev);
                        for (let y = rowsRef.current; y < newRows; y++) {
                            for (let x = 0; x < colsRef.current; x++) next.add(toKey(x, y));
                        }
                        return next;
                    });
                }
                setRows(newRows);
            }
        } else if (resizingRef.current === 'left') {
            // Updated: 2x multiplier for centered layout
            const addedCols = Math.floor(-dx * 2 / squareSizeRef.current);
            const newCols = Math.max(1, Math.min(20, startDimRef.current.cols + addedCols));

            if (newCols !== colsRef.current) {
                const diff = newCols - colsRef.current;
                if (diff === 0) return;

                // Shift pieces
                setPlacedPieces(prev => {
                    const next: any = {};
                    Object.entries(prev).forEach(([key, val]) => {
                        const [x, y] = key.split(',').map(Number);
                        const newX = x + diff;
                        if (newX >= 0 && newX < newCols) next[toKey(newX, y)] = val;
                    });
                    return next;
                });

                // Shift active squares
                setActiveSquares(prev => {
                    const next = new Set<string>();
                    prev.forEach(key => {
                        const [x, y] = key.split(',').map(Number);
                        const newX = x + diff;
                        if (newX >= 0 && newX < newCols) next.add(toKey(newX, y));
                    });
                    // Fill new column if expanding
                    if (diff > 0) {
                        for (let x = 0; x < diff; x++) {
                            for (let y = 0; y < rowsRef.current; y++) next.add(toKey(x, y));
                        }
                    }
                    return next;
                });
                setCols(newCols);
                // REMOVED: startPosRef text adjustment
            }
        } else if (resizingRef.current === 'top') {
            // Updated: 2x multiplier for centered layout
            const addedRows = Math.floor(-dy * 2 / squareSizeRef.current);
            const newRows = Math.max(1, Math.min(20, startDimRef.current.rows + addedRows));

            if (newRows !== rowsRef.current) {
                const diff = newRows - rowsRef.current;
                if (diff === 0) return;

                setPlacedPieces(prev => {
                    const next: any = {};
                    Object.entries(prev).forEach(([key, val]) => {
                        const [x, y] = key.split(',').map(Number);
                        const newY = y + diff;
                        if (newY >= 0 && newY < newRows) next[toKey(x, newY)] = val;
                    });
                    return next;
                });

                setActiveSquares(prev => {
                    const next = new Set<string>();
                    prev.forEach(key => {
                        const [x, y] = key.split(',').map(Number);
                        const newY = y + diff;
                        if (newY >= 0 && newY < newRows) next.add(toKey(x, newY));
                    });
                    if (diff > 0) {
                        for (let y = 0; y < diff; y++) {
                            for (let x = 0; x < colsRef.current; x++) next.add(toKey(x, y));
                        }
                    }
                    return next;
                });
                setRows(newRows);
                // REMOVED: startPosRef text adjustment
            }
        }
    };

    const handlePointerUp = () => {
        if (resizingRef.current) {
            saveToHistory(placedPiecesRef.current, activeSquaresRef.current, rowsRef.current, colsRef.current);
        }
        resizingRef.current = null;
        startPosRef.current = null;
        startDimRef.current = null;
        document.removeEventListener('mousemove', handlePointerMove);
        document.removeEventListener('mouseup', handlePointerUp);
        document.removeEventListener('touchmove', handlePointerMove);
        document.removeEventListener('touchend', handlePointerUp);
    };

    const handleSquareAction = useCallback((x: number, y: number, isInitialClick: boolean = false) => {
        const key = toKey(x, y);

        if (editMode === 'shape') {
            if (isInitialClick) {
                const newValue = !activeSquaresRef.current.has(key);
                setPaintValue(newValue);
                setActiveSquares(prev => {
                    const next = new Set(prev);
                    if (newValue) next.add(key);
                    else next.delete(key);
                    return next;
                });
                if (!newValue) {
                    setPlacedPieces(prev => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                    });
                }
            } else if (paintValueRef.current !== null) {
                const pv = paintValueRef.current;
                setActiveSquares(prev => {
                    const next = new Set(prev);
                    if (pv) next.add(key);
                    else next.delete(key);
                    return next;
                });
                if (!pv) {
                    setPlacedPieces(prev => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                    });
                }
            }
        } else if (editMode === 'pieces') {
            if (activeSquaresRef.current.has(key)) {
                const pieceToPlace = {
                    type: String(selectedPiece.type),
                    color: String(selectedPiece.color),
                    size: squareSizeRef.current * 0.8 // use ref
                };

                setPlacedPieces((prev: any) => ({
                    ...prev,
                    [key]: pieceToPlace
                }));
            }
        }
    }, [editMode, selectedPiece.type, selectedPiece.color]);

    const handleMouseDown = useCallback((x: number, y: number, e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsPainting(true);
        handleSquareAction(x, y, true);
    }, [handleSquareAction]);

    const handleMouseEnter = useCallback((x: number, y: number) => {
        if (isPaintingRef.current) {
            handleSquareAction(x, y, false);
        }
        if (isRightClickPaintingRef.current && editMode === 'pieces') {
            const key = toKey(x, y);
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }, [handleSquareAction, editMode]);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isPainting || isRightClickPainting) {
                saveToHistory(placedPiecesRef.current, activeSquaresRef.current, rowsRef.current, colsRef.current);
            }
            setIsPainting(false);
            setIsRightClickPainting(false);
            setPaintValue(null);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [isPainting, isRightClickPainting]);

    const handleSquareClick = (x: number, y: number, e: React.MouseEvent) => {
        // We now handle this via mousedown/mouseenter for drag support
    };

    const removePiece = useCallback((x: number, y: number, e: React.MouseEvent) => {
        e.preventDefault();
        const key = toKey(x, y);

        // Start right-click painting mode for pieces
        if (editMode === 'pieces') {
            setIsRightClickPainting(true);
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        } else if (editMode === 'shape' && activeSquaresRef.current.has(key)) {
            setActiveSquares(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }, [editMode]);

    return (
        <div ref={containerRef} className="flex flex-col items-center animate-in fade-in zoom-in duration-500 w-full">
            {/* Controls Overlay */}
            <div className="flex items-center gap-6 mb-8 px-6 py-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-200 dark:border-white/10 shadow-xl">
                {/* Board Stats */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-stone-500 dark:text-white/40 uppercase tracking-widest font-bold">Grid Size</span>
                        <span className="text-xl font-black text-stone-900 dark:text-white tabular-nums tracking-tighter">
                            {cols} <span className="text-accent/60">×</span> {rows}
                        </span>
                    </div>
                </div>

                <div className="w-px h-8 bg-stone-900/10 dark:bg-white/10" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                        className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-white/60 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-white/5 active:scale-95"
                        title="Zoom Out"
                    >
                        <Minus size={18} />
                    </button>
                    <div className="flex flex-col items-center min-w-12">
                        <span className="text-[9px] text-stone-500 dark:text-white/40 uppercase font-bold mb-0.5">Zoom</span>
                        <span className="text-sm font-bold text-stone-900 dark:text-white tabular-nums">{Math.round(zoom * 100)}%</span>
                    </div>
                    <button
                        onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                        className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-white/60 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-white/5 active:scale-95"
                        title="Zoom In"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Canvas Wrapper */}
            <div
                className="relative bg-transparent shadow-2xl rounded-sm transition-all duration-200 ease-out select-none"
                style={{
                    width: cols * SQUARE_SIZE,
                    height: rows * SQUARE_SIZE,
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* Grid Loop */}
                {Array.from({ length: rows }).map((_, y) => (
                    <div key={y} className="flex">
                        {Array.from({ length: cols }).map((_, x) => {
                            const key = toKey(x, y);
                            return (
                                <EditorSquare
                                    key={key}
                                    x={x}
                                    y={y}
                                    isActive={activeSquares.has(key)}
                                    isBlackSquare={(x + y) % 2 === 1}
                                    piece={placedPieces[key]}
                                    editMode={editMode}
                                    selectedPiece={selectedPiece}
                                    boardStyle={boardStyle}
                                    squareSize={SQUARE_SIZE}
                                    onMouseDown={handleMouseDown}
                                    onMouseEnter={handleMouseEnter}
                                    onContextMenu={removePiece}
                                    customCollection={customCollection}
                                />
                            );
                        })}
                    </div>
                ))}

                {/* --- Resize Handles --- */}
                {/* RIGHT handle */}
                <div
                    className="absolute top-0 -right-10 w-10 h-full cursor-e-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handlePointerDown('right', e)}
                    onTouchStart={(e) => handlePointerDown('right', e)}
                    style={{ touchAction: 'none' }}
                >
                    <div className="w-8 h-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripVertical size={20} />
                    </div>
                </div>

                {/* LEFT handle */}
                <div
                    className="absolute top-0 -left-10 w-10 h-full cursor-w-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handlePointerDown('left', e)}
                    onTouchStart={(e) => handlePointerDown('left', e)}
                    style={{ touchAction: 'none' }}
                >
                    <div className="w-8 h-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripVertical size={20} />
                    </div>
                </div>

                {/* BOTTOM handle */}
                <div
                    className="absolute -bottom-10 left-0 w-full h-10 cursor-s-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handlePointerDown('bottom', e)}
                    onTouchStart={(e) => handlePointerDown('bottom', e)}
                    style={{ touchAction: 'none' }}
                >
                    <div className="h-8 w-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripHorizontal size={20} />
                    </div>
                </div>

                {/* TOP handle */}
                <div
                    className="absolute -top-10 left-0 w-full h-10 cursor-n-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handlePointerDown('top', e)}
                    onTouchStart={(e) => handlePointerDown('top', e)}
                    style={{ touchAction: 'none' }}
                >
                    <div className="h-8 w-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripHorizontal size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
}
