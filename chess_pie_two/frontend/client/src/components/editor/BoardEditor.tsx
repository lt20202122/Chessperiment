'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, GripHorizontal, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { getPieceImage } from '@/app/[locale]/game/Data';
import { EditMode } from '@/app/[locale]/editor/board/page';

// Utils to convert x,y to string key
const toKey = (x: number, y: number) => `${x},${y}`;

const getPieceScale = (type: string) => {
    switch (type.toLowerCase()) {
        case 'king': return 0.96;
        case 'queen': return 0.94;
        case 'bishop': return 0.88;
        case 'knight': return 0.88;
        case 'rook': return 0.82;
        case 'pawn': return 0.78;
        default: return 0.85;
    }
};

interface BoardEditorProps {
    editMode: EditMode;
    selectedPiece: { type: string, color: string };
    boardStyle: string;
}

export default function BoardEditor({ editMode, selectedPiece, boardStyle }: BoardEditorProps) {

    const [rows, setRows] = useState(8);
    const [cols, setCols] = useState(8);
    const [placedPieces, setPlacedPieces] =
        useState<Record<string, { type: string; color: string }>>({});
    const [activeSquares, setActiveSquares] = useState<Set<string>>(new Set());

    useEffect(() => {
        const savedRows = Number(localStorage.getItem('boardEditorRows') || 8);
        const savedCols = Number(localStorage.getItem('boardEditorCols') || 8);
        const savedPieces = JSON.parse(
            localStorage.getItem('boardEditorPlacedPieces') || '{}'
        );

        setRows(savedRows);
        setCols(savedCols);
        setPlacedPieces(savedPieces);

        const initial = new Set<string>();
        for (let y = 0; y < savedRows; y++) {
            for (let x = 0; x < savedCols; x++) {
                initial.add(toKey(x, y));
            }
        }
        setActiveSquares(initial);
    }, []);


    useEffect(() => {
        localStorage.setItem('boardEditorRows', rows.toString());
        localStorage.setItem('boardEditorCols', cols.toString());
        localStorage.setItem('boardEditorPlacedPieces', JSON.stringify(placedPieces));
    }, [rows, cols, placedPieces]);


    const [squareSize, setSquareSize] = useState(70);

    useEffect(() => {
        const updateSize = () => {
            if (typeof window === 'undefined') return;
            
            const container = document.querySelector('.flex-1.p-4.sm\\:p-6.md\\:p-8.lg\\:p-12');
            if (!container) return;
            
            const availableWidth = container.clientWidth;
            const availableHeight = container.clientHeight;
            
            const widthBasedSize = Math.floor(availableWidth / (cols + 2));
            const heightBasedSize = Math.floor(availableHeight / (rows + 2));
            
            const newSize = Math.max(20, Math.min(widthBasedSize, heightBasedSize, 70));

            setSquareSize(newSize);
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [rows, cols]);

    const SQUARE_SIZE = squareSize;

    // Resizing logic
    const resizingRef = useRef<'cols' | 'rows' | null>(null);
    const startPosRef = useRef<{ x: number, y: number } | null>(null);
    const startDimRef = useRef<{ rows: number, cols: number } | null>(null);

    const handleMouseDown = (type: 'cols' | 'rows', e: React.MouseEvent) => {
        e.preventDefault();
        resizingRef.current = type;
        startPosRef.current = { x: e.clientX, y: e.clientY };
        startDimRef.current = { rows, cols };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!resizingRef.current || !startPosRef.current || !startDimRef.current) return;

        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;

        if (resizingRef.current === 'cols') {
            const addedCols = Math.floor(dx / SQUARE_SIZE);
            const newCols = Math.max(1, Math.min(20, startDimRef.current.cols + addedCols));

            if (newCols > startDimRef.current.cols) {
                setActiveSquares(prev => {
                    const next = new Set(prev);
                    for (let x = startDimRef.current!.cols; x < newCols; x++) {
                        for (let y = 0; y < startDimRef.current!.rows; y++) {
                            next.add(toKey(x, y));
                        }
                    }
                    return next;
                });
            }
            setCols(newCols);
        } else {
            const addedRows = Math.floor(dy / SQUARE_SIZE);
            const newRows = Math.max(1, Math.min(20, startDimRef.current.rows + addedRows));

            if (newRows > startDimRef.current.rows) {
                setActiveSquares(prev => {
                    const next = new Set(prev);
                    for (let y = startDimRef.current!.rows; y < newRows; y++) {
                        for (let x = 0; x < startDimRef.current!.cols; x++) {
                            next.add(toKey(x, y));
                        }
                    }
                    return next;
                });
            }
            setRows(newRows);
        }
    };

    const handleMouseUp = () => {
        resizingRef.current = null;
        startPosRef.current = null;
        startDimRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleSquareClick = (x: number, y: number, e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const key = toKey(x, y);

        if (editMode === 'shape') {
            const newSet = new Set(activeSquares);
            if (activeSquares.has(key)) {
                newSet.delete(key);
                const newPieces = { ...placedPieces };
                delete newPieces[key];
                setPlacedPieces(newPieces);
            } else {
                newSet.add(key);
            }
            setActiveSquares(newSet);
        } else if (editMode === 'pieces') {
            if (activeSquares.has(key)) {
                // EXPLICIT COPY to avoid reference issues
                const pieceToPlace = {
                    type: String(selectedPiece.type),
                    color: String(selectedPiece.color)
                };

                setPlacedPieces(prev => ({
                    ...prev,
                    [key]: pieceToPlace
                }));
            }
        }
    };

    const removePiece = (x: number, y: number, e: React.MouseEvent) => {
        e.preventDefault();
        const key = toKey(x, y);
        if (editMode === 'pieces') {
            const newPieces = { ...placedPieces };
            delete newPieces[key];
            setPlacedPieces(newPieces);
        } else if (editMode === 'shape' && activeSquares.has(key)) {
            const newSet = new Set(activeSquares);
            newSet.delete(key);
            setActiveSquares(newSet);
            const newPieces = { ...placedPieces };
            delete newPieces[key];
            setPlacedPieces(newPieces);
        }
    };

    return (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
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
                            const isActive = activeSquares.has(key);
                            const isBlackSquare = (x + y) % 2 === 1;
                            const piece = placedPieces[key];

                            return (
                                <div
                                    key={key}
                                    style={{ width: SQUARE_SIZE, height: SQUARE_SIZE }}
                                    className={`
                    relative flex items-center justify-center group
                    ${isActive
                                            ? (isBlackSquare ? 'bg-[#779954]' : 'bg-[#e9edcc]')
                                            : 'bg-gray-300/10 border border-gray-400/20 border-dashed hover:border-accent hover:bg-accent/10 cursor-pointer'}
                    ${editMode === 'pieces' && isActive ? 'cursor-cell' : ''}
                  `}
                                    onContextMenu={(e) => removePiece(x, y, e)}
                                    onClick={(e) => handleSquareClick(x, y, e)}
                                >
                                    {/* Piece rendering */}
                                    {isActive && piece && (
                                        <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                                            <Image
                                                src={getPieceImage(boardStyle, piece.color, piece.type)}
                                                alt={piece.type}
                                                width={SQUARE_SIZE * getPieceScale(piece.type)}
                                                height={SQUARE_SIZE * getPieceScale(piece.type)}
                                                unoptimized
                                                className="drop-shadow-lg transform transition-transform group-hover:scale-105"
                                                priority
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
                                            <Image
                                                src={getPieceImage(boardStyle, selectedPiece.color, selectedPiece.type)}
                                                alt={`${selectedPiece.color} ${selectedPiece.type} preview`}
                                                width={SQUARE_SIZE * getPieceScale(selectedPiece.type)}
                                                height={SQUARE_SIZE * getPieceScale(selectedPiece.type)}
                                                unoptimized
                                                className="bg-transparent"
                                                priority
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* --- Resize Handles --- */}
                <div
                    className="absolute top-0 -right-10 w-10 h-full cursor-e-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handleMouseDown('cols', e)}
                >
                    <div className="w-8 h-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripVertical size={20} />
                    </div>
                </div>

                <div
                    className="absolute -bottom-10 left-0 w-full h-10 cursor-s-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handleMouseDown('rows', e)}
                >
                    <div className="h-8 w-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripHorizontal size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
}
