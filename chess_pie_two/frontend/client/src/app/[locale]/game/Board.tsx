"use client";
import Image from "next/image";
import { pieces, pieceImagesv1, pieceImagesv2, PieceType } from "./Data";
import { useState, useEffect, useRef } from "react";
import Loading from "@/app/loading";
import Back from "./Back";
import { Chess, Square } from "chess.js";
import { socket } from "./Socket"; // Socket aus Chat importieren
import { boardToFEN, piecesListToBoard } from "./utilities";

export default function Board() {
  const [boardPieces, setBoardPieces] = useState<PieceType[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("boardPieces");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          console.warn("Fehler beim Parsen von sessionStorage");
          return pieces;
        }
      }
    }
    return pieces;
  });

  const [boardStyle, setBoardStyle] = useState("v2");
  const [blockSize, setBlockSize] = useState(80);
  const [select, setSelect] = useState<PieceType | null>(null);
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);
  const [currentRoom, setCurrentRoom] = useState("");
  const [isMyTurn, setIsMyTurn] = useState(false); // Initial false
  const [myColor, setMyColor] = useState<"white" | "black">("white");

  const chessRef = useRef(new Chess());
  const [startPos, setStartPos] = useState("");

  // Farbe und Raum aus localStorage laden
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedColor = localStorage.getItem("myColor");
      const savedRoom = localStorage.getItem("currentRoom");

      if (savedColor) {
        setMyColor(savedColor as "white" | "black");
        // Weiß startet immer
        setIsMyTurn(savedColor === "white");
      }
      if (savedRoom) {
        setCurrentRoom(savedRoom);
      }
    }
  }, []);

  // Socket.IO Events
  useEffect(() => {
    console.log("Socket listener setup...");

    // Zug vom Gegner empfangen
    const handleMove = (data: any) => {
      console.log("🔵 MOVE empfangen:", data);

      try {
        // Rochade
        if (data.castle) {
          console.log("Rochade erkannt:", data.castle);
          chessRef.current.move(data.castle);

          let updatedPieces = boardPieces.map((p) =>
            p.position === data.from ? { ...p, position: data.to } : p
          );

          if (data.castle === "O-O") {
            const rookStart = data.from === "e1" ? "h1" : "h8";
            const rookEnd = data.from === "e1" ? "f1" : "f8";
            updatedPieces = updatedPieces.map((p) =>
              p.position === rookStart ? { ...p, position: rookEnd } : p
            );
          } else if (data.castle === "O-O-O") {
            const rookStart = data.from === "e1" ? "a1" : "a8";
            const rookEnd = data.from === "e1" ? "d1" : "d8";
            updatedPieces = updatedPieces.map((p) =>
              p.position === rookStart ? { ...p, position: rookEnd } : p
            );
          }

          setBoardPieces(updatedPieces);
          setIsMyTurn(true);

          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "boardPieces",
              JSON.stringify(updatedPieces)
            );
          }
          return;
        }

        // Normaler Zug
        console.log("Normaler Zug von", data.from, "nach", data.to);
        const result = chessRef.current.move({
          from: data.from as Square,
          to: data.to as Square,
        });

        if (result) {
          console.log("✅ Zug erfolgreich in chess.js");

          // Board aktualisieren
          const updatedPieces = boardPieces
            .filter((p) => p.position !== data.to) // Geschlagene Figur entfernen
            .map((p) =>
              p.position === data.from ? { ...p, position: data.to } : p
            );

          console.log("Board aktualisiert:", updatedPieces);
          setBoardPieces(updatedPieces);
          setIsMyTurn(true);

          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "boardPieces",
              JSON.stringify(updatedPieces)
            );
          }
        } else {
          console.error("❌ chess.js hat Zug abgelehnt");
        }
      } catch (error) {
        console.error("❌ Fehler beim Verarbeiten des Gegner-Zugs:", error);
      }
    };

    // Raum erstellt - Weiß startet
    const handleRoomCreated = (data: any) => {
      console.log("Raum erstellt:", data.roomKey);
      setCurrentRoom(data.roomKey);
      setMyColor("white");
      setIsMyTurn(true); // Weiß beginnt
    };

    // Raum beigetreten - Schwarz wartet
    const handleJoinedRoom = (data: any) => {
      console.log("Raum beigetreten:", data.roomKey);
      setCurrentRoom(data.roomKey);
      setMyColor("black");
      setIsMyTurn(false); // Schwarz wartet
    };

    // Spieler beigetreten
    const handlePlayerJoined = (data: any) => {
      console.log("Spieler beigetreten:", data);
    };

    // Listener registrieren
    socket.on("move", handleMove);
    socket.on("room_created", handleRoomCreated);
    socket.on("joined_room", handleJoinedRoom);
    socket.on("player_joined", handlePlayerJoined);

    // Cleanup
    return () => {
      console.log("Socket listeners entfernt");
      socket.off("move", handleMove);
      socket.off("room_created", handleRoomCreated);
      socket.off("joined_room", handleJoinedRoom);
      socket.off("player_joined", handlePlayerJoined);
    };
  }, [boardPieces]); // Dependency: boardPieces

  // Chess.js initialisieren
  useEffect(() => {
    if (!boardPieces) return;
    chessRef.current.clear();
    const board = piecesListToBoard(boardPieces);
    const fen = boardToFEN(board);
    chessRef.current.load(fen);
    console.log("Chess.js geladen mit FEN:", fen);
  }, []);

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
    else if (sw > 800) return baseSize * 0.8;
    else if (sw > 600) return baseSize * 0.7;
    else return baseSize * 0.5;
  }

  async function handlePieceSelect(pos: string) {
    // Nicht am Zug
    if (!isMyTurn) {
      console.log("❌ Nicht am Zug!");
      return;
    }

    const clickedPiece = boardPieces.find((p) => p.position === pos);

    // Bereits ausgewählte Figur
    if (select) {
      // Gleiche Farbe erneut klicken → abbrechen
      if (clickedPiece && clickedPiece.color === select.color) {
        setSelect(null);
        setSelectedPos(null);
        return;
      }

      let updatedPieces;
      const castleStr = detectCastling(startPos, pos);

      // Rochade
      if (castleStr) {
        try {
          console.log("🏰 Rochade:", castleStr);
          chessRef.current.move(castleStr);

          updatedPieces = boardPieces.map((p) =>
            p === select ? { ...p, position: pos } : p
          );

          if (castleStr === "O-O") {
            const rookStart = startPos === "e1" ? "h1" : "h8";
            const rookEnd = startPos === "e1" ? "f1" : "f8";
            updatedPieces = updatedPieces.map((p) =>
              p.position === rookStart ? { ...p, position: rookEnd } : p
            );
          } else if (castleStr === "O-O-O") {
            const rookStart = startPos === "e1" ? "a1" : "a8";
            const rookEnd = startPos === "e1" ? "d1" : "d8";
            updatedPieces = updatedPieces.map((p) =>
              p.position === rookStart ? { ...p, position: rookEnd } : p
            );
          }

          setBoardPieces(updatedPieces);

          // Zug an Gegner senden
          if (currentRoom) {
            console.log("📤 Sende Rochade:", {
              room: currentRoom,
              from: startPos,
              to: pos,
              castle: castleStr,
            });
            socket.emit("move", {
              room: currentRoom,
              from: startPos,
              to: pos,
              castle: castleStr,
            });
          }

          setIsMyTurn(false);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "boardPieces",
              JSON.stringify(updatedPieces)
            );
          }
        } catch (error) {
          console.log("❌ Rochade fehlgeschlagen:", error);
          chessRef.current.undo();
          setSelect(null);
          setSelectedPos(null);
          return;
        }
      }
      // Normaler Zug
      else {
        const legal = isLegalMove(startPos, pos);

        if (!legal) {
          console.log("❌ Zug NICHT legal");
          setSelect(null);
          setSelectedPos(null);
          return;
        }

        console.log("✅ Zug legal:", startPos, "→", pos);
        chessRef.current.move({ from: startPos as Square, to: pos as Square });

        updatedPieces = boardPieces
          .filter((p) => p.position !== pos)
          .map((p) => (p === select ? { ...p, position: pos } : p));

        setBoardPieces(updatedPieces);

        // Zug an Gegner senden
        if (currentRoom) {
          console.log("📤 Sende Zug:", {
            room: currentRoom,
            from: startPos,
            to: pos,
          });
          socket.emit("move", {
            room: currentRoom,
            from: startPos,
            to: pos,
          });
        }

        setIsMyTurn(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("boardPieces", JSON.stringify(updatedPieces));
        }
      }

      setSelect(null);
      setSelectedPos(null);
      return;
    }

    // Figur auswählen (nur eigene Farbe)
    if (clickedPiece && clickedPiece.color === myColor) {
      setSelect(clickedPiece);
      setSelectedPos(pos);
      setStartPos(pos);
      console.log("Figur ausgewählt:", pos, clickedPiece);
    } else if (clickedPiece) {
      console.log(
        "❌ Falsche Farbe! Du bist:",
        myColor,
        "Figur ist:",
        clickedPiece.color
      );
    }
  }

  const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
  if (!boardPieces || boardPieces.length === 0) return <Loading />;

  let isWhite = true;
  let content = [];

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

      content.push(
        <div
          key={`${i}-${a}`}
          className={`${
            isWhite ? "bg-gray-50" : "bg-[#5d8643]"
          } m-0 aspect-square relative ${eckenKlasse} flex items-center justify-center ${
            selectedPos === pos ? "ring-4 ring-blue-500" : ""
          } ${!isMyTurn ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
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
                boardStyle === "v1"
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
    <div className="flex justify-center">
      <div
        className={`bg-[hsl(0,0%,90%)] ml-4 mt-4 grid gap-0 border-black border-2 w-fit h-fit rounded-[10px] p-2 ${
          !isMyTurn ? "opacity-70" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(8, ${blockSize}px)`,
        }}
      >
        {content}
      </div>

      {/* Turn Indicator */}
      <div className="ml-4 mt-4 p-3 bg-gray-200 rounded h-fit">
        <p
          className={`font-semibold text-lg ${
            isMyTurn ? "text-green-600" : "text-red-600"
          }`}
        >
          {isMyTurn ? "✅ Dein Zug!" : "⏳ Gegner ist dran"}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Du spielst: {myColor === "white" ? "Weiß ⚪" : "Schwarz ⚫"}
        </p>
        {currentRoom && (
          <p className="text-xs text-gray-500 mt-2">
            Raum: {currentRoom.substring(0, 12)}...
          </p>
        )}
      </div>

      <Back />
    </div>
  );
}
