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
        const squaresCopy: Record<Square, PieceState | null> = {} as any;
        for (const s in this.squares) {
            const piece = this.squares[s as Square];
            // If the piece has a clone method (it should if it's a Piece class instance), use it.
            if (piece && typeof (piece as any).clone === 'function') {
                squaresCopy[s as Square] = (piece as any).clone();
            } else if (piece) {
                // Fallback for plain objects if any
                squaresCopy[s as Square] = { ...piece };
            } else {
                squaresCopy[s as Square] = null;
            }
        }
        const clonedManager = new BoardStateManager(squaresCopy);
        clonedManager.history = [...this.history];
        clonedManager.turn = this.turn;
        return clonedManager;
    }
}
