"use client"
import Image from "next/image";
import { pieces, pieceImagesv1, pieceImagesv2, PieceType } from "./Data";
import BoardStyle from './BoardStyle'
import {useState, useEffect} from 'react'
import Loading from '@/app/loading'
import Back from './Back'
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Board() {
    const [boardPieces, setBoardPieces] = useState<PieceType[]>(() => {
            if (typeof window !== "undefined") {
                const saved = localStorage.getItem("boardPieces");
                if (saved) {
                    try {
                        return JSON.parse(saved);
                    } catch {
                        console.warn("Fehler beim Parsen von localStorage, Standardboard geladen.");
                        return pieces;
                    }
                }
                const saved2 = localStorage.getItem("whites_turn");
                if (saved2) {
                    try {
                        return JSON.parse(saved2)
                    } catch {
                        console.warn("Error when parsing localStorage, setting whites turn")
                        return pieces
                    }
                }
            }
            return pieces;
        });
    const [boardStyle, setBoardStyle] = useState("v2")
    const [blockSize, setBlockSize] = useState(80)
    const [select, setSelect] = useState<PieceType | null>(null);
    const [selectedPos, setSelectedPos] = useState<string | null>(null)
    const [screenWidth, setScreenWidth] = useState(0)
    const [screenHeight, setScreenHeight] = useState(0)
    let isWhite = true;
    let content = [];
    const [legal, setLegal] = useState<boolean | null>(null)
    const [whites_turn, setWhites_Turn] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const savedTurn = localStorage.getItem("whites_turn");
            if (savedTurn) return JSON.parse(savedTurn);
        }
        return true;
    });
    useEffect(() => {
  const updateSize = () => {
    const headerHeight = 65; // px
    const rows = 8; 

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Breitenabhängige BlockSize
    let widthBlock;
    if (screenWidth >= 800) widthBlock = 80;
    else if (screenWidth >= 600) widthBlock = 60;
    else widthBlock = 40;

    // Höhenabhängige BlockSize
    const maxHeightBlock = (screenHeight - headerHeight - 40) / rows; // 20px Puffer oben/unten

    // Breite + Höhe berücksichtigen
    const finalBlockSize = Math.min(widthBlock, maxHeightBlock);

    setBlockSize(finalBlockSize);
    setScreenWidth(screenWidth);
    setScreenHeight(screenHeight);
  };

  updateSize(); // initial
  window.addEventListener("resize", updateSize);
  return () => window.removeEventListener("resize", updateSize);
}, []);

    const [startPos, setStartPos] = useState("")
    const [take, setTake] = useState(false)
    
    async function handlePieceSelect(pos: string) {
        const clickedPiece = boardPieces.find(p => p.position === pos);

        if (select) {
            if (clickedPiece && clickedPiece.color === select.color) return;

            try {
                if (clickedPiece) setTake(true)
                const res = await fetch(`${BACKEND_URL}/move?move=${startPos}-${pos}-${take}`);
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
                if (typeof window !== undefined) {localStorage.setItem("boardPieces", JSON.stringify(updatedPieces)); localStorage.setItem("whites_turn", JSON.stringify(whites_turn))}
                setSelect(null);
                setSelectedPos(null);
                setTake(false)
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
    if (!boardPieces || boardPieces.length === 0) return <Loading />

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
            console.log(piece)

            if (piece) {
                switch (piece.type.toLowerCase()) {
                    case "pawn": piece.size = piece.setSize(65, screenWidth, screenHeight); break;
                    case "rook": piece.size = piece.setSize(60, screenWidth, screenHeight); break;
                    case "queen": piece.size = piece.setSize(75, screenWidth, screenHeight); break;
                    case "king": piece.size = piece.setSize(75, screenWidth, screenHeight); break;
                    case "knight": piece.size = piece.setSize(69, screenWidth, screenHeight); break;
                    case "bishop": piece.size = piece.setSize(70, screenWidth, screenHeight); break;
                    default: piece.size = 30; break;
                }
            }
            content.push(
                <div
                    key={`${i}-${a}`}
                    className={`${isWhite ? "bg-gray-50" : "bg-board-green-1"} m-0 aspect-square relative ${eckenKlasse} flex items-center justify-center ${selectedPos === pos ? "border-black border-2" : ""}`}
                    style = {{
                        width:blockSize,
                        height:blockSize
                    }}
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
        <div className="flex justify-center">
        <div className={`bg-[hsl(0,0%,90%)] ml-4 mt-4 grid gap-0 border-black border-2 w-fit h-fit rounded-[10px] p-2`}
        style={{
            gridTemplateColumns: `repeat(8, ${blockSize}px)`
        }}
  >
            {content}
        </div>
            <Back />
        </div>
    );
}
