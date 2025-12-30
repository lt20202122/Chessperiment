import type { BoardState, Square, PieceState } from "./types";

export class BoardStateManager {
    private squares: Record<Square, PieceState | null>;
    private history: Array<{ from: Square; to: Square; pieceId: string }>;
    public turn: "white" | "black";

    constructor(initialSquares: Record<Square, PieceState | null>) {
        this.squares = initialSquares;
        this.history = [];
        this.turn = "white";
    }

    getPiece(square: Square): PieceState | null {
        return this.squares[square] || null;
    }

    setPiece(square: Square, piece: PieceState | null) {
        this.squares[square] = piece;
    }

    addMoveToHistory(from: Square, to: Square, pieceId: string) {
        this.history.push({ from, to, pieceId });
        this.turn = this.turn === "white" ? "black" : "white";
    }

    getHistory() {
        return this.history;
    }

    getSquares() {
        return { ...this.squares };
    }

    clone(): BoardStateManager {
        const clonedManager = new BoardStateManager(this.getSquares());
        clonedManager.history = [...this.history];
        clonedManager.turn = this.turn;
        return clonedManager;
    }
}
