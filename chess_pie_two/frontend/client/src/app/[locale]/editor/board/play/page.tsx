"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Board from '@/app/[locale]/game/Board';

interface PlacedPiece {
    type: string;
    color: string;
}

interface CustomBoard {
    activeSquares: string[];
    placedPieces: {
        [square: string]: PlacedPiece;
    };
}

export default function PlayPage() {
    const router = useRouter();
    const [board, setBoard] = useState<CustomBoard | null>(null);
    const [fen, setFen] = useState<string | null>(null);

    useEffect(() => {
        const boardData = sessionStorage.getItem('board');
        if (boardData) {
            const parsedBoard: CustomBoard = JSON.parse(boardData);
            setBoard(parsedBoard);

            let fenString = "";
            for (let i = 0; i < 8; i++) {
                let emptySquares = 0;
                for (let j = 0; j < 8; j++) {
                    const square = `${String.fromCharCode(97 + j)}${8 - i}`;
                    const piece = parsedBoard.placedPieces[square];
                    if (piece) {
                        if (emptySquares > 0) {
                            fenString += emptySquares;
                            emptySquares = 0;
                        }
                        fenString += piece.color === 'white' ? piece.type.charAt(0).toUpperCase() : piece.type.charAt(0).toLowerCase();
                    } else {
                        emptySquares++;
                    }
                }
                if (emptySquares > 0) {
                    fenString += emptySquares;
                }
                if (i < 7) {
                    fenString += "/";
                }
            }
            fenString += " w - - 0 1";
            setFen(fenString);

        } else {
            router.push('/editor/board');
        }

        return () => {
            sessionStorage.removeItem('board');
        };
    }, [router]);

    if (!board || !fen) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-lg p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <div className="flex justify-between mb-4">
                    <h1 className="text-2xl font-bold">Play vs. Yourself</h1>
                </div>
                <Board
                    initialFen={fen}
                    disableValidation={true}
                    onMove={(move) => {
                        setFen(move.fen);
                    }}
                />
            </div>
        </div>
    );
}
