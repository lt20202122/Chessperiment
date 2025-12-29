"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import Board from '@/app/[locale]/game/Board';

export default function PlayPage() {
    const router = useRouter();
    const [board, setBoard] = useState<any>(null);
    const [game, setGame] = useState<any>(null);
    const [moveValidation, setMoveValidation] = useState(true);

    useEffect(() => {
        const boardData = sessionStorage.getItem('board');
        if (boardData) {
            const parsedBoard = JSON.parse(boardData);
            setBoard(parsedBoard);
            const newGame = new Chess();
            newGame.clear();
            parsedBoard.activeSquares.forEach((square: string) => {
                const piece = parsedBoard.placedPieces[square];
                if (piece) {
                    newGame.put({ type: piece.type.charAt(0).toLowerCase(), color: piece.color.charAt(0) }, square as any);
                }
            });
            setGame(newGame);
        } else {
            router.push('/editor/board');
        }

        return () => {
            sessionStorage.removeItem('board');
        };
    }, [router]);

    if (!board) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-lg p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <div className="flex justify-between mb-4">
                    <h1 className="text-2xl font-bold">Play vs. Yourself</h1>
                    <div className="flex items-center">
                        <span className="mr-2">Move Validation</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={moveValidation}
                                onChange={() => setMoveValidation(!moveValidation)}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
                <Board
                    initialFen={game.fen()}
                    onMove={(move) => {
                        if (moveValidation) {
                            try {
                                game.move(move);
                            } catch (error) {
                                console.error('Invalid move:', error);
                            }
                        } else {
                            game.move(move, { sloppy: true });
                        }
                        setGame(new Chess(game.fen()));
                    }}
                />
                <div className="flex justify-between mt-4">
                    <div className="text-lg font-bold">
                        Turn: {game.turn() === 'w' ? 'White' : 'Black'}
                    </div>
                    <button
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-500"
                        onClick={() => {
                            const boardData = sessionStorage.getItem('board');
                            if (boardData) {
                                const parsedBoard = JSON.parse(boardData);
                                const newGame = new Chess();
                                newGame.clear();
                                parsedBoard.activeSquares.forEach((square: string) => {
                                    const piece = parsedBoard.placedPieces[square];
                                    if (piece) {
                                        newGame.put({ type: piece.type.charAt(0).toLowerCase(), color: piece.color.charAt(0) }, square as any);
                                    }
                                });
                                setGame(newGame);
                            }
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}
