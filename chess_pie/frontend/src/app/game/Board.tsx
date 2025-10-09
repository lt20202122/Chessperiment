"use client"
import Image from "next/image";
import { pieces, pieceImagesv1, pieceImagesv2, PieceType } from "./Data";
import BoardStyle from './BoardStyle'
import {useState} from 'react'

export default function Board({boardStyle, setBoardStyle}:{boardStyle:string, setBoardStyle:(value:any) => void}) {
    const [boardPieces, setBoardPieces] = useState<PieceType[]>(pieces);
    const [select, setSelect] = useState<PieceType | null>(null);
    const [selectedPos, setSelectedPos] = useState<string | null>(null)
    let isWhite = true;
    let content = [];
    const [legal, setLegal] = useState<boolean | null>(null)
    const [whites_turn, setWhites_Turn] = useState<boolean>(true)
    const [startPos, setStartPos] = useState("")

    async function handlePieceSelect(pos: string) {
        const clickedPiece = boardPieces.find(p => p.position === pos);

        if (select) {
            if (clickedPiece && clickedPiece.color === select.color) return;

            try {
                const res = await fetch(`http://127.0.0.1:5000/move?move=${startPos}-${pos}`);
                const data = await res.json();

                console.log("Server-Antwort:", data);
                setLegal(data.legal);

                if (!data.legal) {
                    console.log("Zug ist NICHT legal.");
                    setSelect(null);
                    setSelectedPos(null);
                    return;
                }

                if (whites_turn && select.color !== "white") { setSelect(null); return; }
                if (!whites_turn && select.color !== "black") { setSelect(null); return; }

                setWhites_Turn(!whites_turn);

                const newPos = pos;
                const updatedPieces = boardPieces
                    .filter(p => p.position !== newPos)
                    .map(p => p === select ? { ...p, position: newPos } : p);

                setBoardPieces(updatedPieces);
                setSelect(null);
                setSelectedPos(null);
                console.log("Neues Brett:", updatedPieces);

            } catch (err) {
                console.error("Fehler bei fetch:", err);
            }

        } else {
            setSelect(clickedPiece ?? null);
            setSelectedPos(pos);
            setStartPos(pos);
            console.log("Ausgewählt:", pos);
        }
    }


    const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];

    for (let i = 7; i >= 0; i--) {
        for (let a = 0; a < 8; a++) {
            const pos = `${columns[a]}${i + 1}`;

            const isTopLeft = i === 7 && a === 0;
            const isBottomLeft = i === 0 && a === 0;
            const isTopRight = i === 7 && a === 7;
            const isBottomRight = i === 0 && a === 7;

            const eckenKlasse = `
                ${isTopLeft ? "rounded-tl-md" : ""}
                ${isBottomLeft ? "rounded-bl-md" : ""}
                ${isTopRight ? "rounded-tr-md" : ""}
                ${isBottomRight ? "rounded-br-md" : ""}
            `;

            const piece = boardPieces.find(p => p.position === pos);

            if (piece) {
                switch (piece.type.toLowerCase()) {
                    case "pawn": piece.size = 65; break;
                    case "rook": piece.size = 60; break;
                    case "queen": piece.size = 75; break;
                    case "king": piece.size = 80; break;
                    case "knight": piece.size = 69; break;
                    case "bishop": piece.size = 70; break;
                    default: piece.size = 30; break;
                }
            }
            // if (piece) console.log("i: "+i+"  a: "+a+"  piece_type: "+piece.type+"  piece_color: "+piece.color)
            content.push(
                <div
                    key={`${i}-${a}`}
                    className={`${isWhite ? "bg-gray-50" : "bg-BoardGreen1"} h-[80px] w-[80px] m-0 aspect-square relative ${eckenKlasse} flex items-center justify-center ${selectedPos === pos ? "border-black border-2" : ""}`}
                    onClick={() => handlePieceSelect(pos)}
                    id={pos}
                    >
                    {piece && (
                        <Image
                            src={boardStyle === "v1" ? pieceImagesv1[`${piece.color}_${piece.type.toLowerCase()}`] : boardStyle==="v2" ? pieceImagesv2[`${piece.color}_${piece.type.toLowerCase()}`] : pieceImagesv2[`${piece.color}_${piece.type.toLowerCase()}`]}
                            alt={`${piece.color} ${piece.type}`}
                            height={piece.size}
                            width={piece.size}
                            style={{ height: piece.size, width: "auto" }}
                        />
                    )}
                </div>
            );

            isWhite = !isWhite;
        }
        isWhite = !isWhite;
    }

    return (
        <div className="ml-4 mt-4 grid grid-cols-8 gap-0 custom-grid border-black border-2 w-fit h-fit rounded-[10px]">
            {content}
            <BoardStyle />
        </div>
    );
}
