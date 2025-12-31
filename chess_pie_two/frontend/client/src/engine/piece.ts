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

    abstract isValidMove(from: Square, to: Square, BoardClass: BoardClass): boolean;
    abstract clone(): Piece;
}

export class Pawn extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'pawn', color, position);
    }

    isValidMove(from: Square, to: Square, BoardClass: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = toCoordsCoords[1] - fromCoords[1];

        const direction = this.color === 'white' ? 1 : -1;
        const startingRank = this.color === 'white' ? 1 : 6;

        // Standard one-square move
        if (diffX === 0 && diffY === direction) {
            return BoardClass.getPiece(to) === null;
        }

        // Initial two-square move
        if (diffX === 0 && fromCoords[1] === startingRank && diffY === 2 * direction) {
            const pathClear = BoardClass.getPiece(toSquare([fromCoords[0], fromCoords[1] + direction])) === null;
            return pathClear && BoardClass.getPiece(to) === null;
        }

        // Capture
        if (diffX === 1 && diffY === direction) {
            const destinationPiece = BoardClass.getPiece(to);
            return destinationPiece !== null && destinationPiece.color !== this.color;
        }

        return false;
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

    isValidMove(from: Square, to: Square, BoardClass: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        const destinationPiece = BoardClass.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        return (diffX === 2 && diffY === 1) || (diffX === 1 && diffY === 2);
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

    isValidMove(from: Square, to: Square, BoardClass: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        if (diffX !== diffY) {
            return false;
        }

        const destinationPiece = BoardClass.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }
        
        // Check for obstructions
        const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
        const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
        for (let i = 1; i < diffX; i++) {
            const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1] + i * yDirection]);
            if (BoardClass.getPiece(square) !== null) {
                return false;
            }
        }

        return true;
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

    isValidMove(from: Square, to: Square, BoardClass: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        if (diffX !== 0 && diffY !== 0) {
            return false;
        }

        const destinationPiece = BoardClass.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        // Check for obstructions
        if (diffX === 0) {
            const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
            for (let i = 1; i < diffY; i++) {
                const square = toSquare([fromCoords[0], fromCoords[1] + i * yDirection]);
                if (BoardClass.getPiece(square) !== null) {
                    return false;
                }
            }
        } else {
            const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
            for (let i = 1; i < diffX; i++) {
                const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1]]);
                if (BoardClass.getPiece(square) !== null) {
                    return false;
                }
            }
        }

        return true;
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

    isValidMove(from: Square, to: Square, BoardClass: BoardClass): boolean {
        // A queen's move is valid if it's a valid rook or bishop move
        const rook = new Rook(this.id, this.color, from);
        const bishop = new Bishop(this.id, this.color, from);
        return rook.isValidMove(from, to, BoardClass) || bishop.isValidMove(from, to, BoardClass);
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

    isValidMove(from: Square, to: Square, BoardClass: BoardClass): boolean {
        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        const destinationPiece = BoardClass.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        return diffX <= 1 && diffY <= 1;
    }

    clone(): King {
        const p = new King(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}
