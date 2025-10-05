import Image from "next/image";
import { pieces, pieceImages } from "./Data";

export default function Board() {
    let isWhite = true;
    let content = [];


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
                    case "pawn":
                        piece.size = 40;
                        break;
                    case "rook":
                        piece.size = 30;
                        break;
                    case "queen":
                        piece.size = 25;
                        break;
                    case "king":
                        piece.size = 20;
                        break;
                    case "knight":
                        piece.size = 32;
                        break;
                    case "bishop":
                        piece.size = 32;
                        break;
                    default:
                        piece.size = 30; // Standardgröße
                        break;
                }
            }

            content.push(
                <div
                    key={`${i}-${a}`}
                    className={`${isWhite ? "bg-gray-50" : "bg-BoardGreen1"} h-[80px] w-[80px] m-0 aspect-square relative ${eckenKlasse}`}
                >
                    {piece && (
                        <Image
                            src={pieceImages[`${piece.color}_${piece.type.toLowerCase()}`]}
                            alt={`${piece.color} ${piece.type}`}
                            width={piece.size}
                            height={0}
                            className="absolute top-0 left-4 h-auto w-auto"
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
        </div>
    );
}
