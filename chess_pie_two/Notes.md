"use client";
import Image from "next/image";
import { pieces, pieceImagesv1, pieceImagesv2, PieceType } from "./Data";
import { useState, useEffect, useRef } from "react";
import Loading from "@/app/loading";
import Back from "./Back";
import { Chess, Square } from "chess.js";
import Socket, { socket } from "./Socket";
import { boardToFEN, piecesListToBoard } from "./utilities";
import { DndContext } from "@dnd-kit/core";

export default function Board() {
const [boardPieces, setBoardPieces] = useState<PieceType[]>(pieces);
const [boardStyle, setBoardStyle] = useState("v2");
const [blockSize, setBlockSize] = useState(80);
const [select, setSelect] = useState<PieceType | null>(null);
const [selectedPos, setSelectedPos] = useState<string | null>(null);
const [screenWidth, setScreenWidth] = useState(0);
const [screenHeight, setScreenHeight] = useState(0);
const [currentRoom, setCurrentRoom] = useState("");
const [myColor, setMyColor] = useState<"white" | "black" | null>(null);
const [gameStarted, setGameStarted] = useState(false);
const [gameEnded, setGameEnded] = useState(false);

const chessRef = useRef(new Chess());
const [startPos, setStartPos] = useState("");

// Ist der Spieler am Zug? (aus chess.js ableiten)
const isMyTurn = () => {
if (!myColor || !gameStarted || gameEnded) return false;
const turn = chessRef.current.turn(); // "w" oder "b"
return (
(turn === "w" && myColor === "white") ||
(turn === "b" && myColor === "black")
);
};

// State aus localStorage wiederherstellen
useEffect(() => {
if (typeof window !== "undefined") {
const savedColor = localStorage.getItem("myColor");
const savedRoom = localStorage.getItem("currentRoom");
const savedGameStarted = localStorage.getItem("gameStarted");
const savedGameEnded = localStorage.getItem("gameEnded");
const savedFEN = localStorage.getItem("boardFEN");

      console.log("🔄 RELOAD - Lade gespeicherten State:");
      console.log("  Farbe:", savedColor);
      console.log("  Raum:", savedRoom);
      console.log("  Gestartet:", savedGameStarted);
      console.log("  FEN:", savedFEN);

      if (savedColor) {
        const color = savedColor as "white" | "black";
        setMyColor(color);
        console.log("✅ Farbe gesetzt:", color);
      }

      if (savedRoom) {
        setCurrentRoom(savedRoom);
        socket.emit("rejoin_room", { room: savedRoom });
        console.log("✅ Raum beigetreten:", savedRoom);
      }

      if (savedGameStarted === "true") {
        setGameStarted(true);
        console.log("✅ Spiel gestartet");
      }

      if (savedGameEnded === "true") {
        setGameEnded(true);
        console.log("✅ Spiel beendet");
      }

      // WICHTIG: FEN laden und Board daraus generieren
      if (savedFEN) {
        try {
          chessRef.current.load(savedFEN);
          console.log("✅ Chess.js mit FEN geladen");

          // Board aus chess.js generieren
          const board = chessRef.current.board();
          const newPieces: PieceType[] = [];

          board.forEach((row, rowIndex) => {
            row.forEach((square, colIndex) => {
              if (square) {
                const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
                const position = `${columns[colIndex]}${8 - rowIndex}`;

                newPieces.push({
                  type:
                    square.type === "p"
                      ? "Pawn"
                      : square.type === "r"
                      ? "Rook"
                      : square.type === "n"
                      ? "Knight"
                      : square.type === "b"
                      ? "Bishop"
                      : square.type === "q"
                      ? "Queen"
                      : "King",
                  color: square.color === "w" ? "white" : "black",
                  position: position,
                  size: 60,
                });
              }
            });
          });

          setBoardPieces(newPieces);
          console.log(
            "✅ Board-Pieces aktualisiert:",
            newPieces.length,
            "Figuren"
          );
        } catch (e) {
          console.error("❌ Fehler beim Laden des FEN:", e);
        }
      }
    }

}, []);

// Board von chess.js synchronisieren (wenn sich FEN ändert)
const syncBoardFromChess = () => {
const fen = chessRef.current.fen();
const board = chessRef.current.board();
const newPieces: PieceType[] = [];

    board.forEach((row, rowIndex) => {
      row.forEach((square, colIndex) => {
        if (square) {
          const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
          const position = `${columns[colIndex]}${8 - rowIndex}`;

          newPieces.push({
            type:
              square.type === "p"
                ? "Pawn"
                : square.type === "r"
                ? "Rook"
                : square.type === "n"
                ? "Knight"
                : square.type === "b"
                ? "Bishop"
                : square.type === "q"
                ? "Queen"
                : "King",
            color: square.color === "w" ? "white" : "black",
            position: position,
            size: 60,
          });
        }
      });
    });

    setBoardPieces(newPieces);

    if (typeof window !== "undefined") {
      localStorage.setItem("boardFEN", fen);
    }

    return newPieces;

};

const resetBoard = (needConfirm: boolean = true) => {
if (needConfirm && !confirm("Board wirklich zurücksetzen?")) return;

    chessRef.current.reset();
    setBoardPieces(pieces);
    setCurrentRoom("");
    setMyColor(null);
    setGameStarted(false);
    setGameEnded(false);
    setSelect(null);
    setSelectedPos(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("myColor");
      localStorage.removeItem("currentRoom");
      localStorage.removeItem("gameStarted");
      localStorage.removeItem("gameEnded");
      localStorage.removeItem("boardFEN");
    }

    console.log("♻️ Board zurückgesetzt!");

};

// Socket Events
useEffect(() => {
const handleMove = (data: any) => {
console.log("📥 Zug empfangen:", data);

      try {
        if (data.castle) {
          chessRef.current.move(data.castle);
        } else {
          chessRef.current.move({
            from: data.from as Square,
            to: data.to as Square,
          });
        }

        // Board synchronisieren und FEN speichern
        syncBoardFromChess();
        console.log("✅ Board aktualisiert nach Gegner-Zug");
      } catch (error) {
        console.error("❌ Fehler beim Verarbeiten des Zugs:", error);
      }
    };

    const handleRoomCreated = (data: any) => {
      console.log("🏠 Raum erstellt:", data.roomKey);
      setMyColor("white");
      setCurrentRoom(data.roomKey);
      setGameStarted(false);
      setGameEnded(false);

      chessRef.current.reset();
      syncBoardFromChess();

      if (typeof window !== "undefined") {
        localStorage.setItem("myColor", "white");
        localStorage.setItem("currentRoom", data.roomKey);
        localStorage.setItem("gameStarted", "false");
        localStorage.removeItem("gameEnded");
      }
    };

    const handleJoinedRoom = (data: any) => {
      console.log("🚪 Raum beigetreten:", data.roomKey);
      setMyColor("black");
      setCurrentRoom(data.roomKey);
      setGameStarted(true);
      setGameEnded(false);

      if (typeof window !== "undefined") {
        localStorage.setItem("myColor", "black");
        localStorage.setItem("currentRoom", data.roomKey);
        localStorage.setItem("gameStarted", "true");
        localStorage.removeItem("gameEnded");
      }
    };

    const handlePlayerJoined = () => {
      console.log("🎮 Zweiter Spieler beigetreten!");
      setGameStarted(true);

      if (typeof window !== "undefined") {
        localStorage.setItem("gameStarted", "true");
      }
    };

    const handleGameEnded = () => {
      console.log("🏁 Spiel beendet");
      setGameEnded(true);

      if (typeof window !== "undefined") {
        localStorage.setItem("gameEnded", "true");
      }
    };

    socket.on("move", handleMove);
    socket.on("room_created", handleRoomCreated);
    socket.on("joined_room", handleJoinedRoom);
    socket.on("player_joined", handlePlayerJoined);
    socket.on("resign", handleGameEnded);
    socket.on("draw_accepted", handleGameEnded);

    return () => {
      socket.off("move", handleMove);
      socket.off("room_created", handleRoomCreated);
      socket.off("joined_room", handleJoinedRoom);
      socket.off("player_joined", handlePlayerJoined);
      socket.off("resign", handleGameEnded);
      socket.off("draw_accepted", handleGameEnded);
    };

}, [boardPieces]);

// Responsive Size
useEffect(() => {
const updateSize = () => {
const headerHeight = 65;
const rows = 8;
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

      let widthBlock;
      if (screenWidth >= 800) widthBlock = 80;
      else if (screenWidth >= 600) widthBlock = 60;
      else widthBlock = 40;

      const maxHeightBlock = (screenHeight - headerHeight - 40) / rows;
      const finalBlockSize = Math.min(widthBlock, maxHeightBlock);

      setBlockSize(finalBlockSize);
      setScreenWidth(screenWidth);
      setScreenHeight(screenHeight);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);

}, []);

function isLegalMove(from: string, to: string) {
try {
const result = chessRef.current.move({
from: from as Square,
to: to as Square,
});
if (result) {
chessRef.current.undo();
return true;
}
return false;
} catch {
return false;
}
}

function detectCastling(from: string, to: string) {
if (from === "e1" && to === "g1") return "O-O";
if (from === "e1" && to === "c1") return "O-O-O";
if (from === "e8" && to === "g8") return "O-O";
if (from === "e8" && to === "c8") return "O-O-O";
return null;
}

function calcSize(baseSize: number, sw: number, sh: number) {
if (sw > 1200) return baseSize;
else if (sw > 800) return baseSize _ 0.8;
else if (sw > 600) return baseSize _ 0.7;
else return baseSize \* 0.5;
}

function handlePieceSelect(pos: string) {
const amIAtTurn = isMyTurn();

    console.log(
      "🖱️ Klick:",
      pos,
      "| Gestartet:",
      gameStarted,
      "| Am Zug:",
      amIAtTurn,
      "| Farbe:",
      myColor
    );

    if (!gameStarted) {
      console.log("❌ Spiel noch nicht gestartet");
      return;
    }

    if (!amIAtTurn) {
      console.log("❌ Nicht am Zug");
      return;
    }

    const clickedPiece = boardPieces.find((p) => p.position === pos);

    if (select) {
      if (clickedPiece && clickedPiece.color === select.color) {
        setSelect(null);
        setSelectedPos(null);
        return;
      }

      const castleStr = detectCastling(startPos, pos);

      if (castleStr) {
        try {
          chessRef.current.move(castleStr);

          if (currentRoom) {
            socket.emit("move", {
              room: currentRoom,
              from: startPos,
              to: pos,
              castle: castleStr,
            });
          }

          syncBoardFromChess();
          console.log("✅ Rochade ausgeführt");
        } catch (error) {
          console.log("❌ Rochade fehlgeschlagen:", error);
          chessRef.current.undo();
        }
      } else {
        const legal = isLegalMove(startPos, pos);

        if (!legal) {
          console.log("❌ Illegaler Zug");
          setSelect(null);
          setSelectedPos(null);
          return;
        }

        chessRef.current.move({ from: startPos as Square, to: pos as Square });

        if (currentRoom) {
          socket.emit("move", {
            room: currentRoom,
            from: startPos,
            to: pos,
          });
        }

        syncBoardFromChess();
        console.log("✅ Zug ausgeführt");
      }

      setSelect(null);
      setSelectedPos(null);
      return;
    }

    if (clickedPiece && clickedPiece.color === myColor) {
      setSelect(clickedPiece);
      setSelectedPos(pos);
      setStartPos(pos);
    }

}

const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
if (!boardPieces || boardPieces.length === 0) return <Loading />;

let isWhite = true;
let content = [];

const rowStart = myColor === "black" ? 0 : 7;
const rowEnd = myColor === "black" ? 8 : -1;
const rowStep = myColor === "black" ? 1 : -1;
const colStart = myColor === "black" ? 7 : 0;
const colEnd = myColor === "black" ? -1 : 8;
const colStep = myColor === "black" ? -1 : 1;

for (
let i = rowStart;
myColor === "black" ? i < rowEnd : i > rowEnd;
i += rowStep
) {
for (
let a = colStart;
myColor === "black" ? a > colEnd : a < colEnd;
a += colStep
) {
const pos = `${columns[a]}${i + 1}`;

      const isTopLeft =
        myColor === "black" ? i === 0 && a === 7 : i === 7 && a === 0;
      const isBottomLeft =
        myColor === "black" ? i === 7 && a === 7 : i === 0 && a === 0;
      const isTopRight =
        myColor === "black" ? i === 0 && a === 0 : i === 7 && a === 7;
      const isBottomRight =
        myColor === "black" ? i === 7 && a === 0 : i === 0 && a === 7;

      const eckenKlasse = `
        ${isTopLeft ? "rounded-tl-md" : ""}
        ${isBottomLeft ? "rounded-bl-md" : ""}
        ${isTopRight ? "rounded-tr-md" : ""}
        ${isBottomRight ? "rounded-br-md" : ""}
      `;

      const piece = boardPieces.find((p) => p.position === pos);

      if (piece) {
        switch (piece.type.toLowerCase()) {
          case "pawn":
            piece.size = calcSize(65, screenWidth, screenHeight);
            break;
          case "rook":
            piece.size = calcSize(60, screenWidth, screenHeight);
            break;
          case "queen":
            piece.size = calcSize(75, screenWidth, screenHeight);
            break;
          case "king":
            piece.size = calcSize(75, screenWidth, screenHeight);
            break;
          case "knight":
            piece.size = calcSize(69, screenWidth, screenHeight);
            break;
          case "bishop":
            piece.size = calcSize(70, screenWidth, screenHeight);
            break;
          default:
            piece.size = 30;
            break;
        }
      }

      const amIAtTurn = isMyTurn();

      content.push(
        <div
          key={`${i}-${a}`}
          className={`${
            isWhite ? "bg-gray-50" : "bg-[#5d8643]"
          } m-0 aspect-square relative ${eckenKlasse} flex items-center justify-center ${
            selectedPos === pos ? "ring-4 ring-blue-500" : ""
          } ${
            !amIAtTurn || !gameStarted
              ? "cursor-not-allowed opacity-70"
              : "cursor-pointer"
          }`}
          style={{
            width: blockSize,
            height: blockSize,
          }}
          onClick={() => handlePieceSelect(pos)}
          id={pos}
        >
          {piece && (
            <Image
              src={
                boardStyle === "v2"
                  ? pieceImagesv2[`${piece.color}_${piece.type.toLowerCase()}`]
                  : pieceImagesv1[`${piece.color}_${piece.type.toLowerCase()}`]
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

const amIAtTurn = isMyTurn();
const currentTurn = chessRef.current.turn() === "w" ? "Weiß" : "Schwarz";

return (

<div className="flex justify-center">
<div
className={`bg-[hsl(0,0%,90%)] ml-4 mt-4 grid gap-0 border-black border-2 w-fit h-fit rounded-[10px] p-2 ${
          !amIAtTurn || !gameStarted ? "opacity-70" : ""
        }`}
style={{
          gridTemplateColumns: `repeat(8, ${blockSize}px)`,
        }} >
{content}
</div>

      <div className="ml-4 mt-4 p-3 bg-gray-200 rounded h-fit space-y-2">
        {!gameStarted ? (
          <p className="font-semibold text-lg text-orange-600">
            ⏳ Warte auf zweiten Spieler...
          </p>
        ) : gameEnded ? (
          <div className="space-y-2">
            <p className="font-semibold text-lg text-red-600">
              🏁 Spiel beendet
            </p>
            <button
              onClick={() => resetBoard(true)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 font-semibold"
            >
              🔄 Board zurücksetzen
            </button>
          </div>
        ) : (
          <>
            <p
              className={`font-semibold text-lg ${
                amIAtTurn ? "text-green-600" : "text-red-600"
              }`}
            >
              {amIAtTurn ? "✅ Dein Zug!" : `⏳ ${currentTurn} ist am Zug`}
            </p>
          </>
        )}

        {myColor && (
          <p className="text-sm text-gray-600 mt-1">
            Du spielst: {myColor === "white" ? "Weiß ⚪" : "Schwarz ⚫"}
          </p>
        )}

        {currentRoom && (
          <p className="text-xs text-gray-500 mt-2">
            Raum: {currentRoom.substring(0, 12)}...
          </p>
        )}
      </div>

      <Back />
      <Socket />
    </div>

);
}

1. Add Drag and Drop with the library I importet
2. Add Promotion (so that you will be asked to which piece you want to promote and you promote)
3. Black doesnt have Remis or resign
4. Check for Stalemate oder Checkmate or the 50-move-rule, three-times-repition and all that
5. After a move, mark the place the piece was orginially standing on and the place it now stands on in yellow. Only do this for the most recent moves
6. Seperation of concerns: Take all the functions and put them into multiple modules.
