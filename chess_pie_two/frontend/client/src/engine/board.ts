import { Square } from './types';
import { Piece, Pawn, Rook, Knight, Bishop, Queen, King, CustomPiece } from './piece';
import { BoardStateManager } from './state';

export class BoardClass {
    private stateManager: BoardStateManager;
    public readonly width: number;
    public readonly height: number;

    constructor(initialPieces?: Record<Square, Piece | null>, activeSquares?: Square[], width: number = 8, height: number = 8) {
        this.width = width;
        this.height = height;
        const squares = initialPieces || this.setupInitialBoard();
        this.stateManager = new BoardStateManager(squares, activeSquares);
    }

    isActive(square: Square): boolean {
        return this.stateManager.isActive(square);
    }

    private setupInitialBoard(): Record<Square, Piece | null> {
        const squares: Partial<Record<Square, Piece>> = {};

        // Place Pawns
        for (let i = 0; i < 8; i++) {
            const file = String.fromCharCode('a'.charCodeAt(0) + i);
            squares[`${file}2`] = new Pawn(`${file}2_w_pawn`, 'white', `${file}2`);
            squares[`${file}7`] = new Pawn(`${file}7_b_pawn`, 'black', `${file}7`);
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

        // Fill empty squares for 8x8 default
        const allSquares: Record<Square, Piece | null> = {};
        for (let col = 0; col < 8; col++) {
            for (let row = 0; row < 8; row++) {
                const square = `${String.fromCharCode('a'.charCodeAt(0) + col)}${row + 1}`;
                allSquares[square] = squares[square] || null;
            }
        }
        return allSquares;
    }

    getPiece(square: Square): Piece | null {
        return this.stateManager.getPiece(square) as Piece | null;
    }

    movePiece(from: Square, to: Square, promotion?: string): void {
        const piece = this.getPiece(from);
        if (piece) {
            const destinationPiece = this.getPiece(to);
            const isCapture = destinationPiece !== null && destinationPiece.color !== piece.color;

            let pieceToMove = piece;
            if (promotion) {
                const newPiece = Piece.create(`${piece.id}_promo`, promotion as any, piece.color, to);
                if (newPiece) pieceToMove = newPiece;
            }
            this.stateManager.setPiece(to, pieceToMove);
            this.stateManager.setPiece(from, null);
            pieceToMove.position = to;
            pieceToMove.hasMoved = true;
            this.stateManager.addMoveToHistory(from, to, pieceToMove.id);

            if (pieceToMove instanceof CustomPiece) {
                pieceToMove.executeLogic('on-move', { from, to, capturedPiece: isCapture ? destinationPiece : null }, this);
                
                if (isCapture) {
                    pieceToMove.executeLogic('on-capture', { from, to, capturedPiece: destinationPiece }, this);
                }
            }
        }
    }

    setPiece(square: Square, piece: Piece | null): void {
        this.stateManager.setPiece(square, piece);
    }

    getSquares(): Record<Square, Piece | null> {
        return this.stateManager.getSquares() as Record<Square, Piece | null>;
    }

    getHistory() {
        return this.stateManager.getHistory();
    }

    getTurn(): "white" | "black" {
        return this.stateManager.turn;
    }

    clone(): BoardClass {
        const clonedBoard = new BoardClass(undefined, undefined, this.width, this.height);
        clonedBoard.stateManager = this.stateManager.clone();
        return clonedBoard;
    }
}
