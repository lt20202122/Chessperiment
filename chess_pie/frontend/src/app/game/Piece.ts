export type PieceType = "Pawn" | "Knight" | "Bishop" | "Rook" | "Queen" | "King";
export type PieceColor = "white" | "black";


export class Piece {
    type: PieceType;
    color: PieceColor;
    position: string; // z.B. "e2"
    gridPos:string;
    size:number;
    constructor (type: PieceType, color: PieceColor, position: string) {
        this.type = type
        this.color = color
        this.position = position
        this.gridPos = ""
        this.size = 0
    }
}