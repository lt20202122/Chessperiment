import { Square } from './types';
import { Piece, Pawn, Rook, Knight, Bishop, Queen, King } from './piece';
import { BoardStateManager } from './state';
import type { Board as IBoard } from './piece';

export class Board implements IBoard {
    private stateManager: BoardStateManager;

    constructor() {
        const initialSquares = this.setupInitialBoard();
        this.stateManager = new BoardStateManager(initialSquares);
    }

    private setupInitialBoard(): Record<Square, Piece | null> {
        const squares: Partial<Record<Square, Piece>> = {};

        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        // Place Pawns
        for (let i = 0; i < 8; i++) {
            const file = files[i];
            squares[`${file}2`] = new Pawn(`${file}2_w_pawn`, 'white', `${file}2` as Square);
            squares[`${file}7`] = new Pawn(`${file}7_b_pawn`, 'black', `${file}7` as Square);
        }

        // Place Rooks, Knights, Bishops
        squares['a1'] = new Rook('a1_w_rook', 'white', 'a1');
        squares['h1'] = new Rook('h1_w_rook', 'white', 'h1');
        squares['a8'] = new Rook('a8_b_rook', 'black', 'a8');
        squares['h8'] = new Rook('h8_b_rook', 'black', 'h8');

        squares['b1'] = new Knight('b1_w_knight', 'white', 'b1');
        squares['g1'] = new Knight('g1_w_knight', 'white', 'g1');
        squares['b8'] = new Knight('b8_b_knight', 'black', 'b8');
        squares['g8'] = new Knight('g8_b_knight', 'black', 'g8');

        squares['c1'] = new Bishop('c1_w_bishop', 'white', 'c1');
        squares['f1'] = new Bishop('f1_w_bishop', 'white', 'f1');
        squares['c8'] = new Bishop('c8_b_bishop', 'black', 'c8');
        squares['f8'] = new Bishop('f8_b_bishop', 'black', 'f8');

        // Place Queens and Kings
        squares['d1'] = new Queen('d1_w_queen', 'white', 'd1');
        squares['d8'] = new Queen('d8_b_queen', 'black', 'd8');
        squares['e1'] = new King('e1_w_king', 'white', 'e1');
        squares['e8'] = new King('e8_b_king', 'black', 'e8');

        const allSquares: Record<Square, Piece | null> = {} as any;
        const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
        for (const file of files) {
            for (const rank of ranks) {
                const square = `${file}${rank}` as Square;
                allSquares[square] = squares[square] || null;
            }
        }
        return allSquares;
    }

    getPiece(square: Square): Piece | null {
        return this.stateManager.getPiece(square) as Piece | null;
    }

    movePiece(from: Square, to: Square): void {
        const piece = this.getPiece(from);
        if (piece) {
            this.stateManager.setPiece(to, piece);
            this.stateManager.setPiece(from, null);
            piece.position = to;
            piece.hasMoved = true;
            this.stateManager.addMoveToHistory(from, to, piece.id);
        }
    }

    getSquares(): Record<Square, Piece | null> {
        return this.stateManager.getSquares() as Record<Square, Piece | null>;
    }

    getHistory() {
        return this.stateManager.getHistory();
    }

    clone(): Board {
        const clonedBoard = new Board();
        clonedBoard.stateManager = this.stateManager.clone();
        return clonedBoard;
    }
}
