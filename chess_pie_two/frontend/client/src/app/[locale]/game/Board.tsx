"use client";
import Image from "next/image";
import { pieces, pieceImagesv1, pieceImagesv2, PieceType } from "./Data";
import { useState, useEffect, useRef, Fragment } from "react";
import Loading from "@/app/loading";
import Back from "./Back";
import { Chess, Square } from "chess.js";
import Socket, { socket } from "./Socket";
import { boardToFEN, piecesListToBoard } from "./utilities";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import "./Board.css";

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
  const [startSquare, setStartSquare] = useState<any>();
  const chessRef = useRef(new Chess());
  const [startPos, setStartPos] = useState("");
  const squareRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activePiece, setActivePiece] = useState<any>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [gameStatus, setGameStatus] = useState<string>("");
  const [moveCount, setMoveCount] = useState(0);
  const [redMarkedSquares, setRedMarkedSquares] = useState<Set<string>>(
    new Set()
  );
  const [lastMoveFrom, setLastMoveFrom] = useState<string | null>(null);
  const [lastMoveTo, setLastMoveTo] = useState<string | null>(null);

  const handleDragStart = (e: DragStartEvent) => {
    setActivePiece(e.active.id as any);
  };

  const isMyTurn = () => {
    if (!myColor || !gameStarted || gameEnded) return false;
    const turn = chessRef.current.turn();
    return (
      (turn === "w" && myColor === "white") ||
      (turn === "b" && myColor === "black")
    );
  };

  const highlightMove = (from: string, to: string) => {
    setLastMoveFrom(from);
    setLastMoveTo(to);
    sessionStorage.setItem("lastMove", JSON.stringify({ from, to }));
  };

  const checkGameStatus = () => {
    const chess = chessRef.current;

    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "Schwarz" : "Weiß";
      setGameStatus(`Schachmatt! ${winner} gewinnt!`);
      setGameEnded(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem("gameStatus", `Schachmatt! ${winner} gewinnt!`);
      }
      if (currentRoom) {
        socket.emit("game_ended", {
          room: currentRoom,
          reason: "checkmate",
          winner,
        });
      }
      return true;
    }

    if (chess.isStalemate()) {
      setGameStatus("Patt! Remis durch Patt.");
      setGameEnded(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem("gameStatus", "Patt! Remis durch Patt.");
      }
      if (currentRoom) {
        socket.emit("game_ended", { room: currentRoom, reason: "stalemate" });
      }
      return true;
    }

    if (chess.isThreefoldRepetition()) {
      setGameStatus("Remis durch dreifache Stellungswiederholung.");
      setGameEnded(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem(
          "gameStatus",
          "Remis durch dreifache Stellungswiederholung."
        );
      }
      if (currentRoom) {
        socket.emit("game_ended", { room: currentRoom, reason: "repetition" });
      }
      return true;
    }

    if (chess.isInsufficientMaterial()) {
      setGameStatus("Remis durch unzureichendes Material.");
      setGameEnded(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem(
          "gameStatus",
          "Remis durch unzureichendes Material."
        );
      }
      if (currentRoom) {
        socket.emit("game_ended", {
          room: currentRoom,
          reason: "insufficient_material",
        });
      }
      return true;
    }

    // Check for 50-move rule and 75-move rule
    const history = chess.history({ verbose: true });
    let halfmoveClock = 0;

    // Count moves since last pawn move or capture
    for (let i = history.length - 1; i >= 0; i--) {
      const move = history[i];
      if (move.captured || move.piece === "p") {
        break;
      }
      halfmoveClock++;
    }

    // 75-move rule (automatic draw)
    if (halfmoveClock >= 150) {
      setGameStatus("Remis durch 75-Züge-Regel.");
      setGameEnded(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem("gameStatus", "Remis durch 75-Züge-Regel.");
      }
      if (currentRoom) {
        socket.emit("game_ended", {
          room: currentRoom,
          reason: "75_move_rule",
        });
      }
      return true;
    }

    // 50-move rule (can claim draw)
    if (halfmoveClock >= 100) {
      setGameStatus("50-Züge-Regel erreicht! Remis kann beansprucht werden.");
    } else if (chess.isDraw()) {
      setGameStatus("Remis!");
      setGameEnded(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
        sessionStorage.setItem("gameStatus", "Remis!");
      }
      if (currentRoom) {
        socket.emit("game_ended", { room: currentRoom, reason: "draw" });
      }
      return true;
    } else if (chess.isCheck()) {
      setGameStatus("Schach!");
    } else {
      setGameStatus("");
    }

    setMoveCount(halfmoveClock);
    return false;
  };

  const isPromotionMove = (from: string, to: string): boolean => {
    const piece = boardPieces.find((p) => p.position === from);
    if (!piece || piece.type !== "Pawn") return false;

    const toRank = parseInt(to[1]);
    if (piece.color === "white" && toRank === 8) return true;
    if (piece.color === "black" && toRank === 1) return true;

    return false;
  };

  const executePromotion = (promotionPiece: "q" | "r" | "b" | "n") => {
    if (!promotionMove) return;

    try {
      chessRef.current.move({
        from: promotionMove.from as Square,
        to: promotionMove.to as Square,
        promotion: promotionPiece,
      });

      if (currentRoom) {
        socket.emit("move", {
          room: currentRoom,
          from: promotionMove.from,
          to: promotionMove.to,
          promotion: promotionPiece,
        });
      }

      highlightMove(promotionMove.from, promotionMove.to);
      syncBoardFromChess();
      checkGameStatus();

      setShowPromotionDialog(false);
      setPromotionMove(null);
    } catch (error) {
      console.error("Fehler bei Bauernumwandlung:", error);
    }
  };

  const attemptMove = (from: string, to: string) => {
    const amIAtTurn = isMyTurn();

    if (!gameStarted) {
      console.log("⏳ Spiel noch nicht gestartet");
      return;
    }

    if (!amIAtTurn) {
      console.log("❌ Nicht am Zug");
      return;
    }

    // Check for promotion
    if (isPromotionMove(from, to)) {
      setPromotionMove({ from, to });
      setShowPromotionDialog(true);
      return;
    }

    const castleStr = detectCastling(from, to);

    try {
      if (castleStr) {
        chessRef.current.move(castleStr);

        if (currentRoom) {
          socket.emit("move", {
            room: currentRoom,
            from,
            to,
            castle: castleStr,
          });
        }

        console.log("✅ Rochade ausgeführt");
      } else {
        const legal = isLegalMove(from, to);

        if (!legal) {
          console.log("❌ Illegaler Zug");
          return;
        }

        chessRef.current.move({ from: from as Square, to: to as Square });

        if (currentRoom) {
          socket.emit("move", {
            room: currentRoom,
            from,
            to,
          });
        }

        console.log("✅ Zug ausgeführt");
      }

      highlightMove(from, to);
      syncBoardFromChess();
      checkGameStatus();
    } catch (error) {
      console.error("❌ Fehler beim Versuch zu ziehen:", error);
      try {
        chessRef.current.undo();
      } catch {}
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) {
      setActivePiece(null);
      return;
    }

    const from = active.id as string;
    const to = over.id as string;

    if (from === to) {
      setActivePiece(null);
      return;
    }

    attemptMove(from, to);
    setActivePiece(null);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedColor = sessionStorage.getItem("myColor");
      const savedRoom = sessionStorage.getItem("currentRoom");
      const savedGameStarted = sessionStorage.getItem("gameStarted");
      const savedGameEnded = sessionStorage.getItem("gameEnded");
      const savedFEN = sessionStorage.getItem("boardFEN");
      const savedGameStatus = sessionStorage.getItem("gameStatus");
      const savedLastMove = sessionStorage.getItem("lastMove");

      console.log("📄 RELOAD - Lade gespeicherten State:");
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

      if (savedGameStatus) {
        setGameStatus(savedGameStatus);
      }

      if (savedFEN) {
        try {
          chessRef.current.load(savedFEN);
          console.log("✅ Chess.js mit FEN geladen");

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

      if (savedLastMove) {
        try {
          const { from, to } = JSON.parse(savedLastMove);
          setLastMoveFrom(from);
          setLastMoveTo(to);
        } catch {}
      }
    }
  }, []);

  const handleRightClick = (pos: string) => {
    const newRedSquares = new Set(redMarkedSquares);

    if (newRedSquares.has(pos)) {
      // Remove red marking
      newRedSquares.delete(pos);
      if (squareRefs.current[pos]) {
        squareRefs.current[pos]!.style.setProperty(
          "--overlay-color",
          "transparent"
        );
      }
    } else {
      // Add red marking
      newRedSquares.add(pos);
      if (squareRefs.current[pos]) {
        squareRefs.current[pos]!.style.setProperty(
          "--overlay-color",
          "#FF000082"
        );
      }
    }

    setRedMarkedSquares(newRedSquares);

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "redMarkedSquares",
        JSON.stringify(Array.from(newRedSquares))
      );
    }

    console.log(
      "Right clicked square:",
      pos,
      "Red squares:",
      Array.from(newRedSquares)
    );
  };

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
      sessionStorage.setItem("boardFEN", fen);
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
    setGameStatus("");
    setRedMarkedSquares(new Set());
    setLastMoveFrom(null);
    setLastMoveTo(null);

    Object.values(squareRefs.current).forEach((el) => {
      if (el) {
        el.style.setProperty("--overlay-color", "transparent");
      }
    });

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("myColor");
      sessionStorage.removeItem("currentRoom");
      sessionStorage.removeItem("gameStarted");
      sessionStorage.removeItem("gameEnded");
      sessionStorage.removeItem("boardFEN");
      sessionStorage.removeItem("lastMove");
      sessionStorage.removeItem("gameStatus");
      sessionStorage.removeItem("redMarkedSquares");
    }

    console.log("♻️ Board zurückgesetzt!");
  };

  useEffect(() => {
    const handleMove = (data: any) => {
      console.log("🔥 Zug empfangen:", data);

      try {
        if (data.promotion) {
          chessRef.current.move({
            from: data.from as Square,
            to: data.to as Square,
            promotion: data.promotion,
          });
        } else if (data.castle) {
          chessRef.current.move(data.castle);
        } else {
          chessRef.current.move({
            from: data.from as Square,
            to: data.to as Square,
          });
        }

        syncBoardFromChess();
        highlightMove(data.from, data.to);
        checkGameStatus();
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
        sessionStorage.setItem("myColor", "white");
        sessionStorage.setItem("currentRoom", data.roomKey);
        sessionStorage.setItem("gameStarted", "false");
        sessionStorage.removeItem("gameEnded");
      }
    };

    const handleJoinedRoom = (data: any) => {
      console.log("🚪 Raum beigetreten:", data.roomKey);
      setMyColor("black");
      setCurrentRoom(data.roomKey);
      setGameStarted(true);
      setGameEnded(false);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("myColor", "black");
        sessionStorage.setItem("currentRoom", data.roomKey);
        sessionStorage.setItem("gameStarted", "true");
        sessionStorage.removeItem("gameEnded");
      }
    };

    const handlePlayerJoined = () => {
      console.log("🎮 Zweiter Spieler beigetreten!");
      setGameStarted(true);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameStarted", "true");
      }
    };

    const handleGameEnded = (data?: any) => {
      console.log("🏁 Spiel beendet", data);
      setGameEnded(true);

      if (data?.status) {
        setGameStatus(data.status);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("gameStatus", data.status);
        }
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("gameEnded", "true");
      }
    };

    socket.on("move", handleMove);
    socket.on("room_created", handleRoomCreated);
    socket.on("joined_room", handleJoinedRoom);
    socket.on("player_joined", handlePlayerJoined);
    socket.on("resign", handleGameEnded);
    socket.on("draw_accepted", handleGameEnded);
    socket.on("game_ended", handleGameEnded);

    return () => {
      socket.off("move", handleMove);
      socket.off("room_created", handleRoomCreated);
      socket.off("joined_room", handleJoinedRoom);
      socket.off("player_joined", handlePlayerJoined);
      socket.off("resign", handleGameEnded);
      socket.off("draw_accepted", handleGameEnded);
      socket.off("game_ended", handleGameEnded);
    };
  }, []);

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
      console.log("⏳ Spiel noch nicht gestartet");
      return;
    }

    if (!amIAtTurn) {
      console.log("❌ Nicht am Zug");
      return;
    }

    const clickedPiece = boardPieces.find((p) => p.position === pos);

    if (select) {
      if (clickedPiece && clickedPiece.color === select.color) {
        setSelect(clickedPiece);
        setSelectedPos(pos);
        setStartPos(pos);
        return;
      }

      attemptMove(startPos, pos);
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

  function DraggablePiece({
    piece,
    size,
    amIAtTurn,
  }: {
    piece: PieceType;
    size: number;
    amIAtTurn: boolean;
  }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: piece.position,
        data: piece,
      });

    const canDrag =
      amIAtTurn && myColor === piece.color && !gameEnded && gameStarted;

    const style: React.CSSProperties = {
      fontSize: size,
      cursor: canDrag ? "grab" : "default",
      userSelect: "none",
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: isDragging ? 0.5 : 1,
      transform: transform
        ? `translate(${transform.x}px, ${transform.y}px)`
        : "none",
      zIndex: 20,
    };

    return (
      <div
        ref={setNodeRef}
        {...(canDrag ? { ...attributes, ...listeners } : {})}
        style={style}
      >
        <Image
          src={
            boardStyle === "v2"
              ? pieceImagesv2[`${piece.color}_${piece.type.toLowerCase()}`]
              : pieceImagesv1[`${piece.color}_${piece.type.toLowerCase()}`]
          }
          alt={`${piece.color} ${piece.type}`}
          height={piece.size}
          width={piece.size}
          style={{ height: size, width: "auto", pointerEvents: "none" }}
        />
      </div>
    );
  }

  function SquareTile({
    pos,
    isWhite,
    eckenKlasse,
    piece,
    blockSize,
    selected,
    isMoveFrom,
    isMoveTo,
    onClick,
    onContextMenu,
  }: {
    pos: string;
    isWhite: boolean;
    eckenKlasse: string;
    piece?: PieceType;
    blockSize: number;
    selected: boolean;
    isMoveFrom: boolean;
    isMoveTo: boolean;
    onClick: (p: string) => void;
    onContextMenu: (e: any) => void;
  }) {
    const { setNodeRef, isOver } = useDroppable({ id: pos });

    const combinedRef = (el: HTMLDivElement | null) => {
      setNodeRef(el);
      squareRefs.current[pos] = el;
    };

    return (
      <div
        key={pos}
        ref={combinedRef}
        className={`square-tile ${isWhite ? "white-square" : "black-square"} ${
          isMoveFrom ? "move-from" : ""
        } ${
          isMoveTo ? "move-to" : ""
        } m-0 aspect-square relative ${eckenKlasse} flex items-center justify-center ${
          selected ? "ring-4 ring-blue-500" : ""
        }`}
        style={{
          width: blockSize,
          height: blockSize,
        }}
        onClick={() => onClick(pos)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(pos);
        }}
      >
        {piece && (
          <DraggablePiece
            piece={piece}
            size={piece.size as number}
            amIAtTurn={isMyTurn()}
          />
        )}
      </div>
    );
  }

  let isWhite = true;
  const content: React.ReactNode[] = [];

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

      content.push(
        <SquareTile
          key={pos}
          pos={pos}
          isWhite={isWhite}
          eckenKlasse={eckenKlasse}
          piece={piece}
          blockSize={blockSize}
          selected={selectedPos === pos}
          isMoveFrom={lastMoveFrom === pos}
          isMoveTo={lastMoveTo === pos}
          onClick={handlePieceSelect}
          onContextMenu={handleRightClick}
        />
      );

      isWhite = !isWhite;
    }
    isWhite = !isWhite;
  }

  const amIAtTurn = isMyTurn();
  const currentTurn = chessRef.current.turn() === "w" ? "Weiß" : "Schwarz";

  return (
    <div className="flex justify-center">
      {showPromotionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-center">
              Bauernumwandlung
            </h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Wähle eine Figur:
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => executePromotion("q")}
                className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Image
                  src={
                    boardStyle === "v2"
                      ? pieceImagesv2[`${myColor}_queen`]
                      : pieceImagesv1[`${myColor}_queen`]
                  }
                  alt="Queen"
                  width={60}
                  height={60}
                />
                <p className="text-xs text-center mt-2">Dame</p>
              </button>
              <button
                onClick={() => executePromotion("r")}
                className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Image
                  src={
                    boardStyle === "v2"
                      ? pieceImagesv2[`${myColor}_rook`]
                      : pieceImagesv1[`${myColor}_rook`]
                  }
                  alt="Rook"
                  width={60}
                  height={60}
                />
                <p className="text-xs text-center mt-2">Turm</p>
              </button>
              <button
                onClick={() => executePromotion("b")}
                className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Image
                  src={
                    boardStyle === "v2"
                      ? pieceImagesv2[`${myColor}_bishop`]
                      : pieceImagesv1[`${myColor}_bishop`]
                  }
                  alt="Bishop"
                  width={60}
                  height={60}
                />
                <p className="text-xs text-center mt-2">Läufer</p>
              </button>
              <button
                onClick={() => executePromotion("n")}
                className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Image
                  src={
                    boardStyle === "v2"
                      ? pieceImagesv2[`${myColor}_knight`]
                      : pieceImagesv1[`${myColor}_knight`]
                  }
                  alt="Knight"
                  width={60}
                  height={60}
                />
                <p className="text-xs text-center mt-2">Springer</p>
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`bg-[hsl(0,0%,90%)] ml-4 mt-4 grid gap-0 border-black border-2 w-fit h-fit rounded-[10px] p-2 ${
          !amIAtTurn || !gameStarted ? "opacity-70" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(8, ${blockSize}px)`,
        }}
      >
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          {content}
          <DragOverlay dropAnimation={null}>
            {activePiece ? (
              <div
                style={{
                  width: blockSize,
                  height: blockSize,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  opacity: 0.8,
                }}
              >
                <Image
                  src={
                    boardStyle === "v2"
                      ? pieceImagesv2[
                          `${
                            boardPieces.find((p) => p.position === activePiece)
                              ?.color
                          }_${boardPieces
                            .find((p) => p.position === activePiece)
                            ?.type.toLowerCase()}`
                        ]
                      : pieceImagesv1[
                          `${
                            boardPieces.find((p) => p.position === activePiece)
                              ?.color
                          }_${boardPieces
                            .find((p) => p.position === activePiece)
                            ?.type.toLowerCase()}`
                        ]
                  }
                  alt=""
                  height={blockSize}
                  width={blockSize}
                  style={{ pointerEvents: "none" }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="ml-4 mt-4 p-3 bg-gray-200 rounded h-fit space-y-2 w-64 min-w-[16rem]">
        {gameStatus && (
          <p className="font-bold text-lg text-red-600 text-center animate-pulse">
            {gameStatus}
          </p>
        )}

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
          <p className="text-xs text-gray-500 mt-2 break-all">
            Raum: {currentRoom.substring(0, 12)}...
          </p>
        )}

        {moveCount >= 100 && (
          <p className="text-xs text-orange-600 font-semibold mt-2">
            ⚠️ {Math.floor(moveCount / 2)} Züge ohne Bauernzug/Schlagen
          </p>
        )}
      </div>

      <Back />
      <Socket
        myColor={myColor}
        gameStarted={gameStarted}
        gameEnded={gameEnded}
        currentRoom={currentRoom}
        onPlayerJoined={() => setGameStarted(true)}
      />
    </div>
  );
}
