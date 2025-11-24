"use client"
import Image from "next/image";
import { pieces, pieceImagesv1, pieceImagesv2, PieceType } from "./Data";
import BoardStyle from './BoardStyle'
import {useState, useEffect, useRef} from 'react'
import Loading from '@/app/loading'
import Back from './Back'
import { Chess, Square } from "chess.js";
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
    const chessRef = useRef(new Chess()); //!
    let isWhite = true;
    let content = [];
    const [legal, setLegal] = useState<boolean | null>(null)
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
    function isLegalMove(from: string, to: string) {
    try {
        const result = chessRef.current.move({ from, to, promotion: "q" });
        if (result) {
        chessRef.current.undo(); // Nur prüfen, nicht wirklich ziehen
        return true;
    }
    return false

    } catch {
        return false;
    }
}

    function calcSize(baseSize: number, sw: number, sh: number) {
        let size = 0;
            // base size is active on sw 1200px. At 600 px, the actual size should be half the base size
        if (sw > 1200) size = baseSize;
        else if (sw > 800) size = baseSize * 0.8;
        else if (sw > 600) size = baseSize * 0.7;
        else size = baseSize * 0.5;

        return size;
    }
    async function handlePieceSelect(pos: string) {
    const clickedPiece = boardPieces.find(p => p.position === pos);

    // 1️⃣ Wenn schon eine Figur ausgewählt ist
    if (select) {
        // Gleiche Farbe? Nichts tun
        if (clickedPiece && clickedPiece.color === select.color) return;

        // Turn-Check: darf die Figur aktuell ziehen?
        const turn = chessRef.current.turn(); // "w" oder "b"
        if ((turn === "w" && select.color !== "white") || (turn === "b" && select.color !== "black")) {
            setSelect(null);
            setSelectedPos(null);
            return;
        }

        const legal = isLegalMove(startPos, pos);
setLegal(legal);

if (!legal) {
    console.log("Zug NICHT legal");
    setSelect(null);
    setSelectedPos(null);
    return;
}

// Wenn legal → wirklich ausführen
chessRef.current.move({ from: startPos as Square, to: pos as Square });

        // 4️⃣ Board-State aktualisieren
        const updatedPieces = boardPieces
            .filter(p => p.position !== pos) // Zielfeld freimachen, falls genommen wird
            .map(p => p === select ? { ...p, position: pos } : p);

        setBoardPieces(updatedPieces);

        // 5️⃣ LocalStorage aktualisieren
        if (typeof window !== "undefined") {
            localStorage.setItem("boardPieces", JSON.stringify(updatedPieces));
            localStorage.setItem("whites_turn", JSON.stringify(chessRef.current.turn() === "w"));
        }

        // 6️⃣ Alles zurücksetzen
        setSelect(null);
        setSelectedPos(null);
        setTake(false);

        console.log("Neues Brett:", updatedPieces);

    } else {
        // 7️⃣ Neue Figur auswählen
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
                    case "pawn": piece.size = calcSize(65, screenWidth, screenHeight); break;
                    case "rook": piece.size = calcSize(60, screenWidth, screenHeight); break;
                    case "queen": piece.size = calcSize(75, screenWidth, screenHeight); break;
                    case "king": piece.size = calcSize(75, screenWidth, screenHeight); break;
                    case "knight": piece.size = calcSize(69, screenWidth, screenHeight); break;
                    case "bishop": piece.size = calcSize(70, screenWidth, screenHeight); break;
                    default: piece.size = 30; break;
                }
            }
            content.push(
                <div
                    key={`${i}-${a}`}
                    className={`${isWhite ? "bg-gray-50" : "bg-[#5d8643]"} m-0 aspect-square relative ${eckenKlasse} flex items-center justify-center ${selectedPos === pos ? "border-black border-2" : ""}`}
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