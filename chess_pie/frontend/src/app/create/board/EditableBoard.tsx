"use client"
import Image from "next/image";
import { pieces, pieceImagesv1, pieceImagesv2, PieceType } from "@/app/game/Data";
import BoardStyle from '@/app/game/BoardStyle'
import {useState} from 'react'
import { useRouter } from "next/navigation";

export default function EditableBoard() {
    const router = useRouter()
    const [boardPieces, setBoardPieces] = useState<PieceType[]>(pieces);
    const [boardStyle, setBoardStyle] = useState("v2")
    const content=[]
    let isWhite = true

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
                    case "pawn": piece.size = 55; break;
                    case "rook": piece.size = 50; break;
                    case "queen": piece.size = 60; break;
                    case "king": piece.size = 60; break;
                    case "knight": piece.size = 57; break;
                    case "bishop": piece.size = 60; break;
                    default: piece.size = 30; break;
                }
            }
            content.push(
                <div
                    key={`${i}-${a}`}
                    className={`${isWhite ? "bg-gray-50" : "bg-BoardGreen1"} h-[60px] w-[60px] m-0 aspect-square relative ${eckenKlasse} flex items-center justify-center`}
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
            isWhite = !isWhite
        }
        isWhite = !isWhite;
    }

    return (
        <div className="ml-4 mt-4 grid grid-cols-8 gap-0 border-black border-2 w-fit h-fit rounded-[10px] bg-white" style={{gridTemplateColumns:"repeat(8,60px)"}}
        onClick={()=>router.push("/create/board")}>
            {content}
            <BoardStyle />
        </div>
    );
}
