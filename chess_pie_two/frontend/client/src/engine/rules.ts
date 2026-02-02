import { Square } from './types';
import { BoardClass as Board } from './board';
import { King, Pawn } from './piece';
import { toCoords, toSquare } from './utils';

export class ValidatorClass {
    private board: Board;

    constructor(board: Board) {
        this.board = board;
    }

    private isSquareAttacked(square: Square, attackerColor: 'white' | 'black', board: Board): boolean {
        const squares = board.getSquares();
        for (const s in squares) {
            const piece = squares[s as Square];
            if (piece && piece.color === attackerColor && board.isActive(s as Square)) {
                if (piece.canAttack(square, board)) {
                    return true;
                }
            }
        }
        return false;
    }

    private _pieceMove(from: Square, to: Square): boolean {
        const piece = this.board.getPiece(from);
        if (!piece) {
            return false;
        }
        // [RESEARCH] This delegates move validation to the individual piece classes.
        // For CustomPiece, this will trigger the custom rules defined in the Piece Editor.
        return piece.isValidMove(from, to, this.board);
    }

    private _isEnPassant(from: Square, to: Square): boolean {
        const piece = this.board.getPiece(from);
        if (!piece || piece.type !== 'pawn') {
            return false;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = toCoordsCoords[1] - fromCoords[1];
        const direction = piece.color === 'white' ? 1 : -1;

        if (diffX === 1 && diffY === direction) {
            const capturedPawnSquare = toSquare([toCoordsCoords[0], toCoordsCoords[1] - direction], this.board.gridType === 'square');
            const capturedPawn = this.board.getPiece(capturedPawnSquare);

            if (capturedPawn instanceof Pawn && capturedPawn.color !== piece.color) {
                const history = this.board.getHistory();
                const lastMove = history[history.length - 1];
                if (
                    lastMove &&
                    lastMove.pieceId === capturedPawn.id &&
                    lastMove.to === capturedPawnSquare &&
                    Math.abs(toCoords(lastMove.from)[1] - toCoords(lastMove.to)[1]) === 2
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    private _isCastling(from: Square, to: Square): boolean {
        const piece = this.board.getPiece(from);
        if (!piece || piece.type !== 'king' || piece.hasMoved) {
            return false;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = toCoordsCoords[0] - fromCoords[0];

        if (Math.abs(diffX) !== 2 || fromCoords[1] !== toCoordsCoords[1]) {
            return false;
        }

        const rank = fromCoords[1];
        const rookFile = diffX > 0 ? 7 : 0;
        const rookSquare = toSquare([rookFile, rank], this.board.gridType === 'square');
        const rook = this.board.getPiece(rookSquare);

        if (!rook || rook.hasMoved) {
            return false;
        }

        const direction = diffX > 0 ? 1 : -1;
        for (let i = 1; i < Math.abs(diffX); i++) {
            const square = toSquare([fromCoords[0] + i * direction, rank], this.board.gridType === 'square');
            if (this.board.getPiece(square) !== null) {
                return false;
            }
        }

        const attackerColor = piece.color === 'white' ? 'black' : 'white';
        if (this.isSquareAttacked(from, attackerColor, this.board)) {
            return false;
        }
        for (let i = 1; i <= Math.abs(diffX); i++) {
            const square = toSquare([fromCoords[0] + i * (diffX > 0 ? 1 : -1), fromCoords[1]], this.board.gridType === 'square');
            if (this.isSquareAttacked(square, attackerColor, this.board)) {
                return false;
            }
        }

        return true;
    }

    isLegal(from: Square, to: Square, promotion?: string): boolean {
        const piece = this.board.getPiece(from);
        if (!piece || piece.color !== this.board.getTurn()) {
            return false;
        }

        if (!this.board.isActive(to)) {
            return false;
        }

        if (this._isCastling(from, to)) {
            return true;
        }

        if (!this._pieceMove(from, to) && !this._isEnPassant(from, to)) {
            return false;
        }

        const tempBoard = this.board.clone();
        const moveSuccess = tempBoard.movePiece(from, to, promotion);
        
        // If the move itself failed (e.g. blocked by logic), it's not legal
        if (!moveSuccess) {
            return false;
        }

        const kingSquare = this.findKing(piece.color, tempBoard);
        if (!kingSquare) {
            // If No King exists, we don't enforce King safety (allows pieces to move in testing or King-less variants)
            return true;
        }

        const attackerColor = piece.color === 'white' ? 'black' : 'white';
        return !this.isSquareAttacked(kingSquare, attackerColor, tempBoard);
    }

    private findKing(color: 'white' | 'black', board: Board): Square | null {
        const squares = board.getSquares();
        for (const s in squares) {
            const piece = squares[s as Square];
            if (piece && piece.type.toLowerCase() === 'king' && piece.color === color) {
                return s as Square;
            }
        }
        return null;
    }
}
