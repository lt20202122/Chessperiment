"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Board from "./Board";
import { ArrowLeft, RefreshCcw } from "lucide-react";

/* =======================
   Types – Custom Board
======================= */

export interface Coord {
    col: number; // 0 .. cols-1
    row: number; // 0 .. rows-1
}

export type PieceType =
    | "pawn"
    | "rook"
    | "knight"
    | "bishop"
    | "queen"
    | "king"
    | string; // allows custom pieces

export type Color = "white" | "black" | string;

export interface PlacedPiece {
    type: PieceType;
    color: Color;
}

// key format: "col,row" (e.g. "3,5")
export type PlacedPieces = Record<string, PlacedPiece>;

export interface CustomBoard {
    cols: number;
    rows: number;
    activeSquares: Coord[];
    placedPieces: PlacedPieces;
}

/* =======================
   Component
======================= */

export default function PlayPage() {
    const router = useRouter();

    const [board, setBoard] = useState<CustomBoard | null>(null);

    useEffect(() => {
        const rawCols = localStorage.getItem("cols");
        const rawRows = localStorage.getItem("rows");
        console.log("PlayPage loaded. localStorage:", { rawCols, rawRows });

        const cols = parseInt(rawCols || "8", 10);
        const rows = parseInt(rawRows || "8", 10);
        const activeSquaresRaw = JSON.parse(localStorage.getItem("activeSquares") ?? "[]");
        const activeSquares: Coord[] = activeSquaresRaw.map((s: string) => {
            const [col, row] = s.split(',').map(Number);
            return { col, row };
        });
        const placedPieces = JSON.parse(localStorage.getItem("placedPieces") ?? "{}");
        setBoard({ cols, rows, activeSquares, placedPieces });
    }, []);

    if (!board) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-lg p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => router.push('/editor/board')} className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Play vs. Yourself</h1>
                    <button onClick={() => window.location.reload()} className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                        <RefreshCcw size={20} />
                    </button>
                </div>

                <Board board={board} />
            </div>
        </div>
    );
}
