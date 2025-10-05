import { Piece } from "./Piece";

export const pieces: Piece[] = [
    new Piece("Rook", "white", "a1"),
    new Piece("Knight", "white", "b1"),
    new Piece("Bishop", "white", "c1"),
    new Piece("Queen", "white", "d1"),
    new Piece("King", "white", "e1"),
    new Piece("Bishop", "white", "f1"),
    new Piece("Knight", "white", "g1"),
    new Piece("Rook", "white", "h1"),

    new Piece("Pawn", "white", "a2"),
    new Piece("Pawn", "white", "b2"),
    new Piece("Pawn", "white", "c2"),
    new Piece("Pawn", "white", "d2"),
    new Piece("Pawn", "white", "e2"),
    new Piece("Pawn", "white", "f2"),
    new Piece("Pawn", "white", "g2"),
    new Piece("Pawn", "white", "h2"),

    new Piece("Pawn", "black", "a7"),
    new Piece("Pawn", "black", "b7"),
    new Piece("Pawn", "black", "c7"),
    new Piece("Pawn", "black", "d7"),
    new Piece("Pawn", "black", "e7"),
    new Piece("Pawn", "black", "f7"),
    new Piece("Pawn", "black", "g7"),
    new Piece("Pawn", "black", "h7"),

    new Piece("Rook", "black", "a8"),
    new Piece("Knight", "black", "b8"),
    new Piece("Bishop", "black", "c8"),
    new Piece("Queen", "black", "d8"),
    new Piece("King", "black", "e8"),
    new Piece("Bishop", "black", "f8"),
    new Piece("Knight", "black", "g8"),
    new Piece("Rook", "black", "h8"),
];

export const pieceImages: Record<string, string> = {
    white_pawn: "/pieces/white_pawn.png",
    black_pawn: "/pieces/black_pawn.png",
    white_bishop: "/pieces/white_bishop.png",
    black_bishop: "/pieces/black_bishop.png",
    white_knight: "/pieces/white_knight.png",
    black_knight: "/pieces/black_knight.png",
    white_rook: "/pieces/white_rook.png",
    black_rook: "/pieces/black_rook.png",
    white_queen: "/pieces/white_queen.png",
    black_queen: "/pieces/black_queen.png",
    white_king: "/pieces/white_king.png",
    black_king: "/pieces/black_king.png",
};
