import { Square } from './types';
class Piece {
        id: string;       // unique ID der Figur: 1,2,3,4,5...
        type: string;     // z.B. "pawn", "knight", "custom_piece"
        color: "white" | "black" | string;
        position: Square;
        hasMoved?: boolean; // für Spezialregeln wie Rochade
        
        constructor(id: string, type: string, color: "white" | "black" | string, position: Square) {
            this.id = id;
            this.type = type;
            this.color = color;
            this.position = position;
            this.hasMoved = false;
        }
}