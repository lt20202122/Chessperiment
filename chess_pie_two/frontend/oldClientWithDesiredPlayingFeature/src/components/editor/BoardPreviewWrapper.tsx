"use client";
import React from 'react';
import { SavedBoard } from '@/lib/firestore';
import Image from 'next/image';
import { getPieceImage } from '@/app/[locale]/game/Data';

import { SquareGrid } from '@/lib/grid/SquareGrid';
import { HexGrid } from '@/lib/grid/HexGrid';

const gridMap = {
    square: new SquareGrid(),
    hex: new HexGrid()
};

export default function BoardPreviewWrapper({ board }: { board: SavedBoard }) {
    const gridType = board.gridType || 'square';
    const grid = gridMap[gridType as keyof typeof gridMap] || gridMap.square;
    const initialTiles = grid.generateInitialGrid(board.rows, board.cols);
    const activeSet = new Set(board.activeSquares);

    // Calculate scaling to fit the preview container
    const isLarge = true; // Preview usually in a fixed container
    const SQUARE_SIZE = 40; // Base size for preview logic

    const clipPath = gridType === 'hex'
        ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        : 'none';

    return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
            <div
                className="relative"
                style={{
                    width: gridType === 'square' ? board.cols * SQUARE_SIZE : (Math.max(board.rows, board.cols) * 1.5 * SQUARE_SIZE),
                    height: gridType === 'square' ? board.rows * SQUARE_SIZE : (Math.max(board.rows, board.cols) * 1.5 * SQUARE_SIZE),
                    transform: 'scale(0.8)', // Slight scale down to ensure it fits with padding
                }}
            >
                {initialTiles.map((coord) => {
                    const key = grid.coordToString(coord);
                    const pos = grid.getPixelPosition(coord, SQUARE_SIZE);
                    const isActive = activeSet.has(key);
                    const piece = board.placedPieces[key];

                    const isDark = gridType === 'square'
                        ? ((coord.x || 0) + (coord.y || 0)) % 2 === 1
                        : ((coord.q || 0) + (coord.r || 0)) % 2 === 0;

                    return (
                        <div
                            key={key}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                            style={{
                                left: pos.x + (gridType === 'hex' ? (Math.max(board.rows, board.cols) * 0.75 * SQUARE_SIZE) : 0),
                                top: pos.y + (gridType === 'hex' ? (Math.max(board.rows, board.cols) * 0.75 * SQUARE_SIZE) : 0),
                                width: SQUARE_SIZE,
                                height: SQUARE_SIZE,
                                clipPath: clipPath
                            }}
                        >
                            <div className={`absolute inset-0 transition-colors ${isActive
                                ? (isDark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]')
                                : 'bg-white/5'
                                }`} />

                            {piece && isActive && (
                                <div className="relative w-[85%] h-[85%] select-none pointer-events-none z-10">
                                    <Image
                                        src={getPieceImage('classic', piece.color as any, piece.type as any)}
                                        alt={`${piece.color} ${piece.type}`}
                                        fill
                                        className="object-contain drop-shadow-md"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
