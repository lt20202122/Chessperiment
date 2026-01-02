import { Square } from './types';
import { toCoords, toSquare } from './utils';
import { BoardClass } from './board';

export abstract class Piece {
    id: string;
    type: string;
    color: "white" | "black";
    position: Square;
    hasMoved: boolean;

    constructor(id: string, type: string, color: "white" | "black", position: Square) {
        this.id = id;
        this.type = type;
        this.color = color;
        this.position = position;
        this.hasMoved = false;
    }

    abstract isValidMove(from: Square, to: Square, board: BoardClass): boolean;
    abstract canAttack(target: Square, board: BoardClass): boolean;
    abstract clone(): Piece;

    static create(id: string, type: string, color: "white" | "black", position: Square): Piece | null {
        switch (type.toLowerCase()) {
            case 'pawn': return new Pawn(id, color, position);
            case 'knight': return new Knight(id, color, position);
            case 'bishop': return new Bishop(id, color, position);
            case 'rook': return new Rook(id, color, position);
            case 'queen': return new Queen(id, color, position);
            case 'king': return new King(id, color, position);
            default: return null;
        }
    }
}

export class Pawn extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'pawn', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = toCoordsCoords[1] - fromCoords[1];

        const direction = this.color === 'white' ? 1 : -1;
        const startingRank = this.color === 'white' ? 1 : 6;

        // Standard one-square move
        if (diffX === 0 && diffY === direction) {
            return board.getPiece(to) === null;
        }

        // Initial two-square move
        if (diffX === 0 && fromCoords[1] === startingRank && diffY === 2 * direction) {
            const pathClear = board.getPiece(toSquare([fromCoords[0], fromCoords[1] + direction])) === null;
            return pathClear && board.getPiece(to) === null;
        }

        // Capture
        if (diffX === 1 && diffY === direction) {
            const destinationPiece = board.getPiece(to);
            return destinationPiece !== null && destinationPiece.color !== this.color;
        }

        return false;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = toCoordsCoords[1] - fromCoords[1];

        const direction = this.color === 'white' ? 1 : -1;

        // Pawns only attack diagonally forward
        return diffX === 1 && diffY === direction;
    }

    clone(): Pawn {
        const p = new Pawn(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Knight extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'knight', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        return (diffX === 2 && diffY === 1) || (diffX === 1 && diffY === 2);
    }

    canAttack(target: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        return (diffX === 2 && diffY === 1) || (diffX === 1 && diffY === 2);
    }

    clone(): Knight {
        const p = new Knight(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Bishop extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'bishop', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        if (diffX !== diffY) {
            return false;
        }

        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }
        
        // Check for obstructions
        const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
        const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
        for (let i = 1; i < diffX; i++) {
            const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1] + i * yDirection]);
            if (board.getPiece(square) !== null || !board.isActive(square)) {
                return false;
            }
        }

        return true;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        if (diffX !== diffY) return false;

        const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
        const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
        for (let i = 1; i < diffX; i++) {
            const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1] + i * yDirection]);
            if (board.getPiece(square) !== null || !board.isActive(square)) {
                return false;
            }
        }
        return true;
    }

    clone(): Bishop {
        const p = new Bishop(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Rook extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'rook', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        if (diffX !== 0 && diffY !== 0) {
            return false;
        }

        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        // Check for obstructions
        if (diffX === 0) {
            const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
            for (let i = 1; i < diffY; i++) {
                const square = toSquare([fromCoords[0], fromCoords[1] + i * yDirection]);
                if (board.getPiece(square) !== null || !board.isActive(square)) {
                    return false;
                }
            }
        } else {
            const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
            for (let i = 1; i < diffX; i++) {
                const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1]]);
                if (board.getPiece(square) !== null || !board.isActive(square)) {
                    return false;
                }
            }
        }

        return true;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        if (diffX !== 0 && diffY !== 0) return false;

        if (diffX === 0) {
            const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
            for (let i = 1; i < diffY; i++) {
                const square = toSquare([fromCoords[0], fromCoords[1] + i * yDirection]);
                if (board.getPiece(square) !== null || !board.isActive(square)) return false;
            }
        } else {
            const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
            for (let i = 1; i < diffX; i++) {
                const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1]]);
                if (board.getPiece(square) !== null || !board.isActive(square)) return false;
            }
        }
        return true;
    }

    clone(): Rook {
        const p = new Rook(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Queen extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'queen', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        // A queen's move is valid if it's a valid rook or bishop move
        // We use static-like calls or shared logic instead of instantiating
        return this.canAttack(to, board) && (board.getPiece(to) === null || board.getPiece(to)?.color !== this.color);
    }

    canAttack(target: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        // Rook-like check
        if (diffX === 0 || diffY === 0) {
            if (diffX === 0) {
                const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
                for (let i = 1; i < diffY; i++) {
                    const square = toSquare([fromCoords[0], fromCoords[1] + i * yDirection]);
                    if (board.getPiece(square) !== null || !board.isActive(square)) return false;
                }
            } else {
                const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
                for (let i = 1; i < diffX; i++) {
                    const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1]]);
                    if (board.getPiece(square) !== null || !board.isActive(square)) return false;
                }
            }
            return true;
        }

        // Bishop-like check
        if (diffX === diffY) {
            const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
            const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
            for (let i = 1; i < diffX; i++) {
                const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1] + i * yDirection]);
                if (board.getPiece(square) !== null || !board.isActive(square)) return false;
            }
            return true;
        }

        return false;
    }

    clone(): Queen {
        const p = new Queen(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class King extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'king', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        return diffX <= 1 && diffY <= 1;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);
        return diffX <= 1 && diffY <= 1;
    }

    clone(): King {
        const p = new King(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}
