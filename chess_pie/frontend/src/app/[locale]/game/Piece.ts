export type PieceType = "Pawn" | "Knight" | "Bishop" | "Rook" | "Queen" | "King";
export type PieceColor = "white" | "black";


export class Piece {
    type: PieceType;
    color: PieceColor;
    position: string; // z.B. "e2"
    gridPos:string;
    size:number;
    id:number;
    constructor (type: PieceType, color: PieceColor, position: string, id:number) {
        this.type = type
        this.color = color
        this.position = position
        this.gridPos = ""
        this.size = 0
        this.id = id
    }
    setSize(baseSize:number, sw:number, sh:number) {
        // baze size is active on sw 1200px. At 600 px, the actual size should be half the base size
        // 1. Verhältnis zwischen 1200px und tatsächlicher Screen Width finden
        const widthDifference = sw/1200

        if (sw>1200) return baseSize
        else if (sw<1200 && sw>800) return baseSize * 0.8
        else if (sw<800 && sw>600) return baseSize * 0.7
        else if (sw<600) return baseSize * 0.5
        return 0
    }
}