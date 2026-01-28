"use client";
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { getPieceImage } from '@/lib/gameData';
import PieceStateIndicators from './PieceStateIndicators';

interface PieceRendererProps {
    type: string;
    color: string;
    size: number;
    pixels?: string[][]; // Optional: direct pixels from Firestore/Library
    image?: string; // NEW: non-pixelated image
    boardStyle?: string;
    className?: string;
    // New props for visual feedback
    variables?: Record<string, number>;
    hasLogic?: boolean;
    isUnderThreat?: boolean;
    recentTrigger?: string | null;
    recentEffect?: string | null;
}

export const PixelPiece = ({ pixels, image, size, className }: { pixels?: string[][], image?: string, size: number, className?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const render = async () => {
            if (image) {
                const img = new globalThis.Image();
                img.src = image;
                await new Promise((resolve) => {
                    img.onload = resolve;
                });
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }

            if (pixels) {
                const rows = pixels.length;
                const cols = pixels[0]?.length || 0;
                if (rows === 0 || cols === 0) return;

                const scale = Math.min(canvas.width / cols, canvas.height / rows);
                const offsetX = (canvas.width - cols * scale) / 2;
                const offsetY = (canvas.height - rows * scale) / 2;

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const color = pixels[r][c];
                        if (color && color !== 'transparent') {
                            ctx.fillStyle = color;
                            ctx.fillRect(
                                Math.floor(offsetX + c * scale),
                                Math.floor(offsetY + r * scale),
                                Math.ceil(scale),
                                Math.ceil(scale)
                            );
                        }
                    }
                }
            }
        };

        render();
    }, [pixels, image, size]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className={className}
            style={{ width: size, height: size, imageRendering: image ? 'auto' : 'pixelated' }}
        />
    );
};

export default function PieceRenderer({
    type,
    color,
    size,
    pixels,
    image,
    boardStyle = "v3",
    className = "",
    variables,
    hasLogic,
    isUnderThreat,
    recentTrigger,
    recentEffect
}: PieceRendererProps) {
    // Render piece content
    let pieceContent: React.ReactNode;
    const isWhite = color === 'white';

    // If we have direct pixels (from Library), use them
    if (pixels || image) {
        pieceContent = <PixelPiece pixels={pixels} image={image} size={size} className={className} />;
    } else {
        // Check if it's a standard piece
        const standardPieces = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
        const lowerType = type.toLowerCase();

        if (standardPieces.includes(lowerType)) {
            pieceContent = (
                <Image
                    src={getPieceImage(boardStyle, color, type)}
                    alt={`${color} ${type}`}
                    height={size}
                    width={size}
                    unoptimized
                    className={`bg-transparent ${className} ${color === 'black' ? 'dark:drop-shadow-[0_0_1.5px_rgba(255,255,255,0.6)]' : ''}`}
                    style={{ height: size, width: "auto", pointerEvents: "none" }}
                />
            );
        } else {
            // It might be a custom piece. Try to find it in localStorage if pixels weren't provided
            if (typeof window !== 'undefined') {
                const collection = JSON.parse(localStorage.getItem('piece_collection') || '{}');
                const customPiece = Object.values(collection).find((p: any) => p.name === type && p.color === color) as any;
                if (customPiece && (customPiece.pixels || customPiece.image)) {
                    pieceContent = <PixelPiece pixels={customPiece.pixels} image={customPiece.image} size={size} className={className} />;
                } else {
                    // Fallback: Show a generic placeholder or the type name
                    pieceContent = (
                        <div
                            className={`flex items-center justify-center rounded-full ${color === 'white' ? 'bg-white text-bg' : 'bg-gray-800 text-white'} ${className}`}
                            style={{ width: size, height: size, fontSize: size * 0.4, fontWeight: 'black' }}
                        >
                            {type.substring(0, 1).toUpperCase()}
                        </div>
                    );
                }
            } else {
                // Fallback for SSR
                pieceContent = (
                    <div
                        className={`flex items-center justify-center rounded-full ${color === 'white' ? 'bg-white text-bg' : 'bg-gray-800 text-white'} ${className}`}
                        style={{ width: size, height: size, fontSize: size * 0.4, fontWeight: 'black' }}
                    >
                        {type.substring(0, 1).toUpperCase()}
                    </div>
                );
            }
        }
    }

    // Wrap in container with state indicators
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {pieceContent}
            <PieceStateIndicators
                variables={variables}
                hasLogic={hasLogic}
                isUnderThreat={isUnderThreat}
                size={size}
                recentTrigger={recentTrigger}
                recentEffect={recentEffect}
            />
        </div>
    );
}
