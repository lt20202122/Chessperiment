export type Square = string; // Erlaubt "a1", "0,0", etc.

export interface PieceState {
    id: string;       // unique ID der Figur: 1,2,3,4,5...
    type: string;     // z.B. "pawn", "knight", "custom_piece"
    color: "white" | "black" | string;
    position: Square;
    hasMoved?: boolean; // für Spezialregeln wie Rochade
    customProps?: Record<string, any>; // für ChessPie-spezifische Regeln
}

export interface BoardState {
    squares: Record<Square, PieceState | null>; // null = leer
    turn: "white" | "black";
    history: Array<{ from: Square; to: Square; pieceId: string }>;
    gridType?: 'square' | 'hex';
    meta?: Record<string, any>; // z.B. Regeln, Sonderbedingungen
}

export interface MoveCondition {
    id: string;
    variable: 'diffX' | 'diffY' | 'absDiffX' | 'absDiffY';
    operator: '===' | '>' | '<' | '>=' | '<=';
    value: number;
    logic?: 'AND' | 'OR';
}

export interface MoveRule {
    id: string;
    conditions: MoveCondition[];
    result: 'allow' | 'disallow';
}

export type pieces = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king"