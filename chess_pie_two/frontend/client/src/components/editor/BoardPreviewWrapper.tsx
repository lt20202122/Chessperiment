"use client";
import React from 'react';
import { SavedBoard } from '@/lib/firestore';
import Image from 'next/image';
import { getPieceImage } from '@/app/[locale]/game/Data';

export default function BoardPreviewWrapper({ board }: { board: SavedBoard }) {
    // Generate board representation
    const squares = [];
    for (let r = 0; r < board.rows; r++) {
        for (let c = 0; c < board.cols; c++) {
            const squareKey = `${c},${r}`;
            const isActive = board.activeSquares.includes(squareKey);
            const piece = board.placedPieces[squareKey];
            const isDark = (r + c) % 2 === 1;

            squares.push(
                <div
                    key={squareKey}
                    className={`relative w-full aspect-square flex items-center justify-center ${isActive
                            ? (isDark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]')
                            : 'bg-transparent opacity-10'
                        }`}
                >
                    {piece && (
                        <div className="relative w-[85%] h-[85%] select-none pointer-events-none">
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
        }
    }

    return (
        <div
            className="grid w-full h-full p-2"
            style={{
                gridTemplateColumns: `repeat(${board.cols}, 1fr)`,
                gridTemplateRows: `repeat(${board.rows}, 1fr)`
            }}
        >
            {squares}
        </div>
    );
}
