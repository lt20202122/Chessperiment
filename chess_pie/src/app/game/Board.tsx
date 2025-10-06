"use client"
import Image from "next/image";
import { pieces, pieceImagesv1, pieceImagesv2, PieceType } from "./Data";
import BoardStyle from './BoardStyle'
import {useState} from 'react'

export default function Board({
    boardStyle,
    setBoardStyle
}: {
    boardStyle: string,
    setBoardStyle: (value: string) => void
}) {
    let isWhite = true;
    let content = [];

    function handlePieceSelect(pos:string) {
        const clickedPiece = boardPieces.find(p => p.position === pos);
        
        if (select) {
            if (clickedPiece && clickedPiece.color === select.color) return
            
            
            const newPos:string = pos
            const updatedPieces = boardPieces.map (p => p===select ? {...p, position:newPos} : p)
            setBoardPieces(() => updatedPieces)
            console.log("Board Pieces: "+boardPieces)

            const updatedPieces2 = boardPieces.filter((p => p.position !== newPos))
                                    .map(p => p === select ? { ...p, position: newPos } : p);
            setBoardPieces(updatedPieces2)
            setSelect(null)
            setSelectedPos(null)
            
            
        }
        else {
            setSelect(clickedPiece ?? null)
            setSelectedPos(pos)
            console.log(pos)

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

        const piece = pieces.find(p => p.position === pos);

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

        content.push(
        <div
            key={`${i}-${a}`}
            className={`${isWhite ? "bg-gray-50" : "bg-BoardGreen1"} h-[80px] w-[80px] m-0 aspect-square relative ${eckenKlasse} flex items-center justify-center`}
        >
            {piece && (
            <Image
                src={boardStyle === "v1"
                ? pieceImagesv1[`${piece.color}_${piece.type.toLowerCase()}`]
                : boardStyle === "v2"
                    ? pieceImagesv2[`${piece.color}_${piece.type.toLowerCase()}`]
                    : pieceImagesv2[`${piece.color}_${piece.type.toLowerCase()}`]
                }
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
        <BoardStyle boardStyle={boardStyle} onChange={setBoardStyle} />
    </div>
    );
}
