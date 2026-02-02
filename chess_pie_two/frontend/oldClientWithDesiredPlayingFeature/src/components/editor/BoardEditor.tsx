'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, GripHorizontal, Plus, X, Minus, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getPieceImage } from '@/app/[locale]/game/Data';
import { EditMode } from '@/app/[locale]/editor/board/PageClient';
import PieceRenderer from '@/components/game/PieceRenderer';
import { SquareGrid } from '@/lib/grid/SquareGrid';
import { HexGrid } from '@/lib/grid/HexGrid';
import { GridType, Coordinate } from '@/lib/grid/GridType';

const gridMap: Record<string, GridType> = {
    square: new SquareGrid(),
    hex: new HexGrid()
};

const getPieceScale = (type: string) => {
    switch (type.toLowerCase()) {
        case 'king': return 0.98;
        case 'queen': return 0.96;
        case 'bishop': return 0.92;
        case 'knight': return 0.92;
        case 'rook': return 0.88;
        case 'pawn': return 0.85;
        default: return 0.95;
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
    squareSize,
    gridType,
    isActive,
    isBlackSquare,
    piece,
    editMode,
    selectedPiece,
    boardStyle,
    onMouseDown,
    onMouseEnter,
    onContextMenu,
    customCollection,
    coord
}: {
    squareSize: number,
    gridType: 'square' | 'hex',
    isActive: boolean,
    isBlackSquare: boolean,
    piece?: { type: string, color: string },
    editMode: string,
    selectedPiece: { type: string, color: string },
    boardStyle: string,
    onMouseDown: (coord: Coordinate, e: React.MouseEvent | React.TouchEvent) => void,
    onMouseEnter: (coord: Coordinate) => void,
    onContextMenu: (coord: Coordinate, e: React.MouseEvent) => void,
    customCollection?: Record<string, any>,
    coord: Coordinate
}) => {
    const grid = gridMap[gridType];
    const customPiece = piece ? (customCollection?.[piece.type] || Object.values(customCollection || {}).find((p: any) => p.name === piece.type)) : undefined;
    const pixels = customPiece?.pixels;

    const clipPath = gridType === 'hex'
        ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        : 'none';

    return (
        <div
            style={{
                width: squareSize,
                height: squareSize,
                clipPath: clipPath
            }}
            className={`
                relative flex items-center justify-center group transition-colors duration-150
                ${isActive
                    ? (isBlackSquare ? 'bg-[#779954]' : 'bg-[#e9edcc]')
                    : 'bg-gray-300/10 border border-gray-400/20 border-dashed hover:border-accent hover:bg-accent/10 cursor-pointer'}
                ${editMode === 'pieces' && isActive ? 'cursor-cell' : ''}
            `}
            onContextMenu={(e) => onContextMenu(coord, e)}
            onMouseDown={(e) => onMouseDown(coord, e)}
            onTouchStart={(e) => onMouseDown(coord, e)}
            onMouseEnter={() => onMouseEnter(coord)}
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
    const [gridType, setGridType] = useState<'square' | 'hex'>(() => (localStorage.getItem('gridType') as 'square' | 'hex') || 'square');
    const grid = gridMap[gridType];

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
            if (stored) return new Set(stored.startsWith('[') ? JSON.parse(stored) : []);
        } catch { }
        return new Set();
    });

    // --- History for Undo/Redo ---
    const [history, setHistory] = useState<{
        placedPieces: Record<string, { type: string; color: string, size: number }>;
        activeSquares: Set<string>;
        rows: number;
        cols: number;
        gridType: 'square' | 'hex';
    }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [symmetry, setSymmetry] = useState<'none' | 'horizontal' | 'vertical' | 'rotational'>('none');

    const saveToHistory = (
        pPieces: Record<string, { type: string; color: string, size: number }>,
        aSquares: Set<string>,
        r: number,
        c: number,
        gt: 'square' | 'hex'
    ) => {
        const newState = {
            placedPieces: JSON.parse(JSON.stringify(pPieces)),
            activeSquares: new Set(aSquares),
            rows: r,
            cols: c,
            gridType: gt
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
        setGridType(prevState.gridType);
        setHistoryIndex(prev => prev - 1);
    };

    const redo = () => {
        if (historyIndex >= history.length - 1) return;
        const nextState = history[historyIndex + 1];
        setPlacedPieces(nextState.placedPieces);
        setActiveSquares(new Set(nextState.activeSquares));
        setRows(nextState.rows);
        setCols(nextState.cols);
        setGridType(nextState.gridType);
        setHistoryIndex(prev => prev + 1);
    };

    // Initial history
    useEffect(() => {
        if (history.length === 0) {
            saveToHistory(placedPieces, activeSquares, rows, cols, gridType);
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
            const initialTiles = grid.generateInitialGrid(rows, cols);
            const newSet = new Set<string>(initialTiles.map(t => grid.coordToString(t)));
            setActiveSquares(newSet);
        }
    }, [rows, cols, activeSquares.size, grid]);

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('rows', rows.toString());
            localStorage.setItem('cols', cols.toString());
            localStorage.setItem('gridType', gridType);
            localStorage.setItem('placedPieces', JSON.stringify(placedPieces));
            localStorage.setItem('activeSquares', JSON.stringify(Array.from(activeSquares)));

            generateBoardData(rows, cols, activeSquares, placedPieces);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [rows, cols, gridType, placedPieces, activeSquares, generateBoardData]);

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
                if (newCols > colsRef.current && gridType === 'square') {
                    setActiveSquares(prev => {
                        const next = new Set(prev);
                        for (let x = colsRef.current; x < newCols; x++) {
                            for (let y = 0; y < rowsRef.current; y++) next.add(grid.coordToString({ x, y }));
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
                if (newRows > rowsRef.current && gridType === 'square') {
                    setActiveSquares(prev => {
                        const next = new Set(prev);
                        for (let y = rowsRef.current; y < newRows; y++) {
                            for (let x = 0; x < colsRef.current; x++) next.add(grid.coordToString({ x, y }));
                        }
                        return next;
                    });
                }
                setRows(newRows);
            }
        } else if (resizingRef.current === 'left' && gridType === 'square') {
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
                        const coord = grid.stringToCoord(key);
                        const newX = (coord.x || 0) + diff;
                        if (newX >= 0 && newX < newCols) next[grid.coordToString({ x: newX, y: coord.y || 0 })] = val;
                    });
                    return next;
                });

                // Shift active squares
                setActiveSquares(prev => {
                    const next = new Set<string>();
                    prev.forEach(key => {
                        const coord = grid.stringToCoord(key);
                        const newX = (coord.x || 0) + diff;
                        if (newX >= 0 && newX < newCols) next.add(grid.coordToString({ x: newX, y: coord.y || 0 }));
                    });
                    // Fill new column if expanding
                    if (diff > 0) {
                        for (let x = 0; x < diff; x++) {
                            for (let y = 0; y < rowsRef.current; y++) next.add(grid.coordToString({ x, y }));
                        }
                    }
                    return next;
                });
                setCols(newCols);
            }
        } else if (resizingRef.current === 'top' && gridType === 'square') {
            // Updated: 2x multiplier for centered layout
            const addedRows = Math.floor(-dy * 2 / squareSizeRef.current);
            const newRows = Math.max(1, Math.min(20, startDimRef.current.rows + addedRows));

            if (newRows !== rowsRef.current) {
                const diff = newRows - rowsRef.current;
                if (diff === 0) return;

                setPlacedPieces(prev => {
                    const next: any = {};
                    Object.entries(prev).forEach(([key, val]) => {
                        const coord = grid.stringToCoord(key);
                        const newY = (coord.y || 0) + diff;
                        if (newY >= 0 && newY < newRows) next[grid.coordToString({ x: coord.x || 0, y: newY })] = val;
                    });
                    return next;
                });

                setActiveSquares(prev => {
                    const next = new Set<string>();
                    prev.forEach(key => {
                        const coord = grid.stringToCoord(key);
                        const newY = (coord.y || 0) + diff;
                        if (newY >= 0 && newY < newRows) next.add(grid.coordToString({ x: coord.x || 0, y: newY }));
                    });
                    if (diff > 0) {
                        for (let y = 0; y < diff; y++) {
                            for (let x = 0; x < colsRef.current; x++) next.add(grid.coordToString({ x, y }));
                        }
                    }
                    return next;
                });
                setRows(newRows);
            }
        }
    };

    const handlePointerUp = () => {
        if (resizingRef.current) {
            saveToHistory(placedPiecesRef.current, activeSquaresRef.current, rowsRef.current, colsRef.current, gridType);
        }
        resizingRef.current = null;
        startPosRef.current = null;
        startDimRef.current = null;
        document.removeEventListener('mousemove', handlePointerMove);
        document.removeEventListener('mouseup', handlePointerUp);
        document.removeEventListener('touchmove', handlePointerMove);
        document.removeEventListener('touchend', handlePointerUp);
    };

    const getSymmetricSquares = (coord: Coordinate): Coordinate[] => {
        if (symmetry === 'none') return [];
        return grid.getSymmetryPoints(coord, symmetry, { rows: rowsRef.current, cols: colsRef.current });
    };

    const handleSquareAction = useCallback((coord: Coordinate, isInitialClick: boolean = false) => {
        const key = grid.coordToString(coord);
        const symSquares = getSymmetricSquares(coord);

        if (editMode === 'shape') {
            if (isInitialClick) {
                const newValue = !activeSquaresRef.current.has(key);
                setPaintValue(newValue);
                setActiveSquares(prev => {
                    const next = new Set(prev);
                    if (newValue) {
                        next.add(key);
                        symSquares.forEach(s => next.add(grid.coordToString(s)));
                    } else {
                        next.delete(key);
                        symSquares.forEach(s => next.delete(grid.coordToString(s)));
                    }
                    return next;
                });
                if (!newValue) {
                    setPlacedPieces(prev => {
                        const next = { ...prev };
                        delete next[key];
                        symSquares.forEach(s => delete next[grid.coordToString(s)]);
                        return next;
                    });
                }
            } else if (paintValueRef.current !== null) {
                const pv = paintValueRef.current;
                setActiveSquares(prev => {
                    const next = new Set(prev);
                    if (pv) {
                        next.add(key);
                        symSquares.forEach(s => next.add(grid.coordToString(s)));
                    } else {
                        next.delete(key);
                        symSquares.forEach(s => next.delete(grid.coordToString(s)));
                    }
                    return next;
                });
                if (!pv) {
                    setPlacedPieces(prev => {
                        const next = { ...prev };
                        delete next[key];
                        symSquares.forEach(s => delete next[grid.coordToString(s)]);
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

                setPlacedPieces((prev: any) => {
                    const next = { ...prev, [key]: pieceToPlace };
                    symSquares.forEach(s => {
                        const symKey = grid.coordToString(s);
                        if (activeSquaresRef.current.has(symKey)) {
                            next[symKey] = { ...pieceToPlace };
                        }
                    });
                    return next;
                });
            }
        }
    }, [editMode, selectedPiece.type, selectedPiece.color, symmetry, grid]);

    const handleMouseDown = useCallback((coord: Coordinate, e: React.MouseEvent | React.TouchEvent) => {
        // Allow left click (button 0) or undefined button (touch)
        if ('button' in e && e.button !== 0) return;

        // Prevent scrolling on touch
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();

        setIsPainting(true);
        handleSquareAction(coord, true);
    }, [handleSquareAction]);

    const handleMouseEnter = useCallback((coord: Coordinate) => {
        // Mouse enter painting
        if (isPaintingRef.current) {
            handleSquareAction(coord, false);
        }
        if (isRightClickPaintingRef.current && editMode === 'pieces') {
            const key = grid.coordToString(coord);
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }, [handleSquareAction, editMode, grid]);

    // Touch Move Handling for "Painting" while dragging finger
    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            if (!isPaintingRef.current) return;
            e.preventDefault(); // Prevent scrolling

            // Calculate which square we are over
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);

            // We need to find the coordinate from the element. 
            // Since we can't easily get props from DOM, we rely on the grid calculation
            // This requires mapping screen space to grid space, which is complex with zoom/pan.
            // Alternatively, if the element is an EditorSquare (or child), maybe we can get data-coord?
        };
        // Implementing proper touch-drag painting requires screen-to-coord mapping, 
        // which exists in the resize logic but might be heavy here. 
        // For now, simple tapping works with proper touchstart integration.
    }, []);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isPainting || isRightClickPainting) {
                saveToHistory(placedPiecesRef.current, activeSquaresRef.current, rowsRef.current, colsRef.current, gridType);
            }
            setIsPainting(false);
            setIsRightClickPainting(false);
            setPaintValue(null);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, [isPainting, isRightClickPainting, gridType]);

    const handleSquareClick = (coord: Coordinate, e: React.MouseEvent) => {
        // We now handle this via mousedown/mouseenter for drag support
    };

    const removePiece = useCallback((coord: Coordinate, e: React.MouseEvent) => {
        e.preventDefault();
        const key = grid.coordToString(coord);
        const symSquares = getSymmetricSquares(coord);

        // Start right-click painting mode for pieces
        if (editMode === 'pieces') {
            setIsRightClickPainting(true);
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[key];
                symSquares.forEach(s => delete next[grid.coordToString(s)]);
                return next;
            });
        } else if (editMode === 'shape' && activeSquaresRef.current.has(key)) {
            setActiveSquares(prev => {
                const next = new Set(prev);
                next.delete(key);
                symSquares.forEach(s => next.delete(grid.coordToString(s)));
                return next;
            });
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[key];
                symSquares.forEach(s => delete next[grid.coordToString(s)]);
                return next;
            });
        }
    }, [editMode, symmetry, grid, getSymmetricSquares]);

    const clearBoard = () => {
        setActiveSquares(new Set());
        setPlacedPieces({});
        saveToHistory({}, new Set(), rows, cols, gridType);
    };

    const resetToStandard = () => {
        const initialTiles = grid.generateInitialGrid(8, 8);
        const newSet = new Set<string>(initialTiles.map(t => grid.coordToString(t)));
        setRows(8);
        setCols(8);
        setActiveSquares(newSet);
        setPlacedPieces({});
        saveToHistory({}, newSet, 8, 8, gridType);
    };

    const [showHexGuide, setShowHexGuide] = useState(false);

    const HexGuide = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-6 top-1/2 -translate-y-1/2 w-80 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl p-6 rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl z-100 max-h-[80vh] overflow-y-auto"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Hexagonal Guide</h3>
                <button onClick={() => setShowHexGuide(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-6">
                <section>
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3">General Movement</h4>
                    <p className="text-sm text-stone-600 dark:text-white/60 leading-relaxed">
                        On a hexagonal grid, pieces move along 3 main axes (6 directions) instead of 2.
                    </p>
                </section>

                <div className="space-y-4">
                    {[
                        { piece: 'Pawn', desc: 'Moves 1 hex forward. Captures to the 2 hexes diagonally forward (same color hexes).' },
                        { piece: 'Rook', desc: 'Moves any distance in 6 orthogonal directions (through hex sides).' },
                        { piece: 'Bishop', desc: 'Moves any distance in 6 diagonal directions (through hex corners).' },
                        { piece: 'Knight', desc: 'L-shape: 2 steps orthogonally then 1 step 60° (jumps over others).' },
                        { piece: 'King', desc: '1 step in any of the 12 directions (6 orthogonal + 6 diagonal).' },
                        { piece: 'Queen', desc: 'Combines Rook and Bishop movement (12 directions total).' }
                    ].map((item: any) => (
                        <div key={item.piece} className="bg-stone-100 dark:bg-white/5 p-3 rounded-xl border border-stone-200 dark:border-white/5">
                            <div className="text-sm font-bold text-stone-900 dark:text-white mb-1">{item.piece}</div>
                            <div className="text-xs text-stone-500 dark:text-white/40 leading-relaxed">{item.desc}</div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed uppercase tracking-wider">
                        Note: This editor follows axial coordinate logic. Actual movement depends on your custom logic or chosen variant (e.g. Glinski vs McCooey).
                    </p>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div ref={containerRef} className="flex flex-col items-center animate-in fade-in zoom-in duration-500 w-full">
            {/* Controls Overlay */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-8 px-4 md:px-6 py-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-200 dark:border-white/10 shadow-xl max-w-[95vw]">
                {/* Grid Type Selector */}
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-[10px] text-stone-500 dark:text-white/40 uppercase tracking-widest font-bold mr-2">Grid</span>
                    <div className="flex bg-stone-100 dark:bg-white/5 rounded-xl p-1 border border-stone-200 dark:border-white/5">
                        {[
                            { id: 'square', label: 'Square' },
                            { id: 'hex', label: 'Hex' }
                        ].map(g => (
                            <button
                                key={g.id}
                                onClick={() => {
                                    if (confirm('Switching grid type will reset the board. Continue?')) {
                                        setGridType(g.id as any);
                                        const newGrid = gridMap[g.id];
                                        const initialTiles = newGrid.generateInitialGrid(rows, cols);
                                        const newActive = new Set(initialTiles.map(t => newGrid.coordToString(t)));
                                        setActiveSquares(newActive);
                                        setPlacedPieces({});
                                        saveToHistory({}, newActive, rows, cols, g.id as any);
                                    }
                                }}
                                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${gridType === g.id ? 'bg-white dark:bg-stone-800 text-accent shadow-sm' : 'text-stone-500 dark:text-white/40 hover:text-stone-900 dark:hover:text-white'}`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-stone-900/10 dark:bg-white/10" />

                {/* Board Stats */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-stone-500 dark:text-white/40 uppercase tracking-widest font-bold">{gridType === 'hex' ? 'Radius' : 'Grid Size'}</span>
                        <span className="text-xl font-black text-stone-900 dark:text-white tabular-nums tracking-tighter">
                            {gridType === 'hex' ? Math.floor(Math.max(rows, cols) / 2) : `${cols} × ${rows}`}
                        </span>
                    </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-stone-900/10 dark:bg-white/10" />

                {/* Symmetry Controls */}
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-[10px] text-stone-500 dark:text-white/40 uppercase tracking-widest font-bold mr-2">Symmetry</span>
                    <div className="flex bg-stone-100 dark:bg-white/5 rounded-xl p-1 border border-stone-200 dark:border-white/5">
                        {[
                            { id: 'none', label: 'None' },
                            { id: 'horizontal', label: 'H' },
                            { id: 'vertical', label: 'V' },
                            { id: 'rotational', label: 'R' }
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSymmetry(s.id as any)}
                                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${symmetry === s.id ? 'bg-white dark:bg-stone-800 text-accent shadow-sm' : 'text-stone-500 dark:text-white/40 hover:text-stone-900 dark:hover:text-white'}`}
                                title={`${s.label} Symmetry`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-stone-900/10 dark:bg-white/10" />

                {/* Utility Controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={clearBoard}
                        className="px-3 sm:px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] sm:text-xs font-bold hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    >
                        Clear
                    </button>
                    <button
                        onClick={resetToStandard}
                        className="px-3 sm:px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-xs font-bold hover:bg-accent hover:text-white transition-all active:scale-95"
                    >
                        Standard
                    </button>
                    {gridType === 'hex' && (
                        <button
                            onClick={() => setShowHexGuide(!showHexGuide)}
                            className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold text-xs ${showHexGuide
                                ? 'bg-amber-500 text-bg border-amber-500 shadow-lg shadow-amber-500/20'
                                : 'bg-white/50 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-600 dark:text-white/60 hover:text-amber-500'
                                }`}
                        >
                            <Info size={16} />
                            Guide
                        </button>
                    )}
                </div>

                <div className="hidden md:block w-px h-8 bg-stone-900/10 dark:bg-white/10" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                        className="p-1.5 sm:p-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-white/60 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-white/5 active:scale-95"
                        title="Zoom Out"
                    >
                        <Minus size={16} />
                    </button>
                    <div className="flex flex-col items-center min-w-10 sm:min-w-12">
                        <span className="text-[8px] sm:text-[9px] text-stone-500 dark:text-white/40 uppercase font-bold">Zoom</span>
                        <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white tabular-nums">{Math.round(zoom * 100)}%</span>
                    </div>
                    <button
                        onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                        className="p-1.5 sm:p-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-white/60 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-white/5 active:scale-95"
                        title="Zoom In"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas Wrapper */}
            <div
                className="relative bg-transparent shadow-2xl rounded-sm transition-all duration-200 ease-out select-none"
                style={{
                    width: gridType === 'square' ? cols * SQUARE_SIZE : (Math.max(rows, cols) * 1.5 * SQUARE_SIZE),
                    height: gridType === 'square' ? rows * SQUARE_SIZE : (Math.max(rows, cols) * 1.5 * SQUARE_SIZE),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div className="relative w-full h-full">
                    {grid.generateInitialGrid(rows, cols).map((coord) => {
                        const key = grid.coordToString(coord);
                        const pos = grid.getPixelPosition(coord, SQUARE_SIZE);
                        const isBlackSquare = gridType === 'square'
                            ? ((coord.x || 0) + (coord.y || 0)) % 2 === 1
                            : ((coord.q || 0) + (coord.r || 0)) % 2 === 0; // Checkerboard doesn't exist for hex, but we can fake highlight or use axial parity

                        return (
                            <div
                                key={key}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: pos.x + (gridType === 'hex' ? (Math.max(rows, cols) * 0.75 * SQUARE_SIZE) : 0),
                                    top: pos.y + (gridType === 'hex' ? (Math.max(rows, cols) * 0.75 * SQUARE_SIZE) : 0),
                                }}
                            >
                                <EditorSquare
                                    coord={coord}
                                    gridType={gridType}
                                    squareSize={SQUARE_SIZE}
                                    isActive={activeSquares.has(key)}
                                    isBlackSquare={isBlackSquare}
                                    piece={placedPieces[key]}
                                    editMode={editMode}
                                    selectedPiece={selectedPiece}
                                    boardStyle={boardStyle}
                                    onMouseDown={handleMouseDown}
                                    onMouseEnter={handleMouseEnter}
                                    onContextMenu={removePiece}
                                    customCollection={customCollection}
                                />
                            </div>
                        );
                    })}
                </div>

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

                <AnimatePresence>
                    {showHexGuide && <HexGuide />}
                </AnimatePresence>
            </div>
        </div>
    );
}
