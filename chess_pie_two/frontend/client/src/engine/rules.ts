import { Square } from "./types";

{/*
1. Piece Move validation
2. 50-move-rule and these things (from state.ts)
3. Checkmate
4. Check
*/}

export class ValidatorClass {
    _pieceMove({ from, to }: { from: Square, to: Square }): boolean {
        // maybe also convert from and to to numbers, so yu dont have a b c d e f g h
        const diffX = from[0].charCodeAt(0) - to[0].charCodeAt(0);
        const diffY = from[1] - to[1];
        // switch (getPiece(from)) {
        //     case 'pawn':
        //         if (diffX === 0 && diffY === 1) return true;
        //         if (diffX === 0 && diffY === 2 && !getPiece(to)) return true;
        //         return false;
        //     case 'knight':
        //         if (diffX === 2 && diffY === 1) return true;
        //         if (diffX === 1 && diffY === 2) return true;
        //         return false;
        //     case 'bishop':
        //         if (diffX === diffY) return true;
        //         return false;
        //     case 'rook':
        //         if (diffX === 0 || diffY === 0) return true;
        //         return false;
        //     case 'queen':
        //         if (diffX === 0 || diffY === 0 || diffX === diffY) return true;
        //         return false;
        //     case 'king':
        //         if (diffX === 1 && diffY === 1) return true;
        //         if (diffX === 1 && diffY === 0) return true;
        //         if (diffX === 0 && diffY === 1) return true;
        //         return false;
        //     default:
        //         return false;
        // }
        // ⬆️ NOT that way! We want code that is easily extendable. So, create a function for each piece in piece.ts
        // ... 
        return true;
    }
    isLegal({from, to}: {from: Square, to: Square}) : boolean {
        if (!this._pieceMove(from, to)) return false;
        // All the other rules like 50-move-rule, checkmate, check, etc.
        return true;
    }
}