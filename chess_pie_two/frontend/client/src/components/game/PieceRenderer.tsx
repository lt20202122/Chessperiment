"use client";
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { getPieceImage } from '@/app/[locale]/game/Data';

interface PieceRendererProps {
    type: string;
    color: string;
    size: number;
    pixels?: string[][]; // Optional: direct pixels from Firestore/Library
    boardStyle?: string;
    className?: string;
}

export const PixelPiece = ({ pixels, size, className }: { pixels: string[][], size: number, className?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !pixels) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rows = pixels.length;
        const cols = pixels[0]?.length || 0;
        if (rows === 0 || cols === 0) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pixelSizeX = canvas.width / cols;
        const pixelSizeY = canvas.height / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const color = pixels[r][c];
                if (color && color !== 'transparent') {
                    ctx.fillStyle = color;
                    // Use floor/ceil to avoid gaps between pixels
                    ctx.fillRect(
                        Math.floor(c * pixelSizeX),
                        Math.floor(r * pixelSizeY),
                        Math.ceil(pixelSizeX),
                        Math.ceil(pixelSizeY)
                    );
                }
            }
        }
    }, [pixels, size]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className={className}
            style={{ width: size, height: size, imageRendering: 'pixelated' }}
        />
    );
};

export default function PieceRenderer({ type, color, size, pixels, boardStyle = "v3", className = "" }: PieceRendererProps) {
    // If we have direct pixels (from Library), use them
    if (pixels) {
        return <PixelPiece pixels={pixels} size={size} className={className} />;
    }

    // Check if it's a standard piece
    const standardPieces = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
    const lowerType = type.toLowerCase();

    if (standardPieces.includes(lowerType)) {
        return (
            <Image
                src={getPieceImage(boardStyle, color, type)}
                alt={`${color} ${type}`}
                height={size}
                width={size}
                unoptimized
                className={`bg-transparent ${className}`}
                style={{ height: size, width: "auto", pointerEvents: "none" }}
            />
        );
    }

    // It might be a custom piece. Try to find it in localStorage if pixels weren't provided
    if (typeof window !== 'undefined') {
        const collection = JSON.parse(localStorage.getItem('piece_collection') || '{}');
        const customPiece = Object.values(collection).find((p: any) => p.name === type && p.color === color) as any;
        if (customPiece && customPiece.pixels) {
            return <PixelPiece pixels={customPiece.pixels} size={size} className={className} />;
        }
    }

    // Fallback: Show a generic placeholder or the type name
    return (
        <div
            className={`flex items-center justify-center rounded-full ${color === 'white' ? 'bg-white text-bg' : 'bg-gray-800 text-white'} ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.4, fontWeight: 'black' }}
        >
            {type.substring(0, 1).toUpperCase()}
        </div>
    );
}
