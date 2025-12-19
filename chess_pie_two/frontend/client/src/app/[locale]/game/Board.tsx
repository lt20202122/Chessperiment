"use client";
import Image from "next/image";
import { pieces, pieceImagesv1, pieceImagesv2, PieceType } from "./Data";
import { useState, useEffect, useRef, Fragment } from "react";
import Loading from "@/app/loading";
import Back from "./Back";
import { Chess, type Square } from "chess.js";
import SocketComponent, { socket } from "./SocketComponent"; // ← HIER: socket importieren!
import { calcSize } from "./utilities";
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
  const [gameInfo, setGameInfo] = useState("");
  const [myColor, setMyColor] = useState<"white" | "black" | null>(null);
  const chessRef = useRef(new Chess());
  const [startPos, setStartPos] = useState("");
  const squareRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activePiece, setActivePiece] = useState<any>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [gameStatus, setGameStatus] = useState<"waiting" | "playing" | "ended" | "">("");
  const [moveCount, setMoveCount] = useState(0);
  const [redMarkedSquares, setRedMarkedSquares] = useState<Set<string>>(
    new Set()
  );
  const [lastMoveFrom, setLastMoveFrom] = useState<string | null>(null);
  const [lastMoveTo, setLastMoveTo] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [simulationPieces, setSimulationPieces] = useState<PieceType[]>([]);

  // ❌ ENTFERNT: Eigener Socket
  // const socketRef = useRef<ReturnType<typeof io> | null>(null);
  // useEffect(() => {
  //   socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL as string);
  //   ...
  // }, []);

  useEffect(() => {
    if (!isViewingHistory) return;
    setRedMarkedSquares(new Set());
    setLastMoveFrom(null);
    setLastMoveTo(null);
    sessionStorage.setItem("lastMove", "");
  }, [isViewingHistory]);

  useEffect(() => {
    // Socket Handler - verwende den importierten socket
    if (!socket) return;

    const handleRoomCreated = (data: any) => {
      console.log("🏠 Raum erstellt:", data.roomId);
      setCurrentRoom(data.roomId);
      setGameStatus("waiting");
      chessRef.current.reset();
      syncBoardFromChess();
    };

    const handleJoinedRoom = (data: any) => {
      console.log("🚪 Raum beigetreten:", data.roomId, "als", data.color);
      setCurrentRoom(data.roomId);
    };

    const handleStartGame = (data: any) => {
      console.log("🎮 Spiel startet!", data);
      setGameStatus("playing");
      setMyColor(data.color);
      setCurrentRoom(data.roomId);
      try {
        chessRef.current.load(data.fen);
        syncBoardFromChess();
      } catch (e) {
        console.error("Fehler beim Laden des FEN bei Spielstart:", e);
      }
    };

    const handleGameEnded = (data?: any) => {
      console.log("🏁 Spiel beendet", data);
      setGameStatus("ended");
      if (data?.status) {
        setGameStatus(data.status);
      }
    };

    const handlePromotionNeeded = (data: any) => {
      setPromotionMove(data);
      setShowPromotionDialog(true);
    };

    const handleIllegalMove = (data: any) => {
      console.error("❌ Illegal move:", data.reason);
      alert(`Ungültiger Zug: ${data.reason}`);
    };

    const handleMove = (data: any) => {
      chessRef.current.load(data.fen);
      syncBoardFromChess();
      highlightMove(data.from, data.to);
    };

    const handleRejoin = (data: any) => {
      console.log("♻️ Rejoined game:", data);

      // 1. Restore Game Identity
      if (data.roomId) setCurrentRoom(data.roomId);
      if (data.color) setMyColor(data.color);
      if (data.status) setGameStatus(data.status);

      // 2. Restore Board State
      if (data.fen) {
        try {
          chessRef.current.reset();
          chessRef.current.load(data.fen);
          syncBoardFromChess();
        } catch (e) {
          console.error("Error loading FEN on rejoin:", e);
        }
      }

      // 3. Restore History
      if (data.history) {
        setMoveHistory(data.history);
        setHistoryIndex(data.history.length - 1);
      }
    };

    socket.on("move", handleMove);
    socket.on("room_created", handleRoomCreated);
    socket.on("joined_room", handleJoinedRoom);
    socket.on("start_game", handleStartGame);
    socket.on("resign", handleGameEnded);
    socket.on("draw_accepted", handleGameEnded);
    socket.on("game_ended", handleGameEnded);
    socket.on("promotion_needed", handlePromotionNeeded);
    socket.on("illegal_move", handleIllegalMove);
    socket.on("rejoin_game", handleRejoin);

    return () => {
      socket.off("move", handleMove);
      socket.off("room_created", handleRoomCreated);
      socket.off("joined_room", handleJoinedRoom);
      socket.off("start_game", handleStartGame);
      socket.off("resign", handleGameEnded);
      socket.off("draw_accepted", handleGameEnded);
      socket.off("game_ended", handleGameEnded);
      socket.off("promotion_needed", handlePromotionNeeded);
      socket.off("illegal_move", handleIllegalMove);
      socket.off("rejoin_game", handleRejoin);
    };
  }, []); // Keine Dependency auf socket nötig, da es konstant ist

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

  useEffect(() => {
    // Restore board after reload - TODO: Fetch from server
  }, []);

  const handleDragStart = (e: DragStartEvent) => {
    setActivePiece(e.active.id as any);
  };

  const isMyTurn = () => {
    if (!myColor || gameStatus !== "playing") return false;
    const turn = chessRef.current.turn();
    return (
      (turn === "w" && myColor === "white") ||
      (turn === "b" && myColor === "black")
    );
  };

  const highlightMove = (from: string, to: string) => {
    if (isViewingHistory) return;
    setLastMoveFrom(from);
    setLastMoveTo(to);
    sessionStorage.setItem("lastMove", JSON.stringify({ from, to }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isViewingHistory) {
      setActivePiece(null);
      return;
    }

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

    // ✅ Verwende den importierten socket, OHNE 'room' im Payload
    console.log("🎯 Sende move:", { from, to });
    socket.emit("move", { from, to });
    setActivePiece(null);
  };

  const handleRightClick = (pos: string) => {
    const newRedSquares = new Set(redMarkedSquares);

    if (newRedSquares.has(pos)) {
      newRedSquares.delete(pos);
      if (squareRefs.current[pos]) {
        squareRefs.current[pos]!.style.setProperty(
          "--overlay-color",
          "transparent"
        );
      }
    } else {
      newRedSquares.add(pos);
      if (squareRefs.current[pos]) {
        squareRefs.current[pos]!.style.setProperty(
          "--overlay-color",
          "#FF000082"
        );
      }
    }

    setRedMarkedSquares(newRedSquares);
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

    const newHistory = chessRef.current.history();
    setMoveHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("moveHistory", JSON.stringify(newHistory));
    }

    return newPieces;
  };

  const resetBoard = (needConfirm: boolean = true) => {
    if (needConfirm && !confirm("Board wirklich zurücksetzen?")) return;

    chessRef.current.reset();
    setBoardPieces(pieces);
    setCurrentRoom("");
    setMyColor(null);
    setGameStatus("waiting");
    setSelect(null);
    setSelectedPos(null);
    setGameStatus("");
    setRedMarkedSquares(new Set());
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setMoveHistory([]);
    setHistoryIndex(-1);
    setIsViewingHistory(false);
    setSimulationPieces([]);

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
      sessionStorage.removeItem("moveHistory");
    }

    console.log("♻️ Board zurückgesetzt!");
  };

  function executePromotion(promotion: "q" | "r" | "b" | "n" | null) {
    setShowPromotionDialog(false);
    if (promotion && promotionMove) {
      // ✅ Verwende den importierten socket
      console.log("🎯 Sende promotion_done:", { promotion });
      socket.emit("promotion_done", { promotion });
    }
  }

  function handlePieceSelect(pos: string) {
    if (isViewingHistory) return;

    const amIAtTurn = isMyTurn();

    console.log(
      "🖱️ Klick:",
      pos,
      "| GameStatus:",
      gameStatus,
      "| Am Zug:",
      amIAtTurn,
      "| Farbe:",
      myColor
    );

    if (gameStatus !== "playing") {
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

      // ✅ Verwende den importierten socket, OHNE 'room' im Payload
      console.log("🎯 Sende move:", { from: select.position, to: pos });
      socket.emit("move", { from: select.position, to: pos });

      setSelect(null);
      setSelectedPos(null);
    }

    if (clickedPiece && clickedPiece.color === myColor) {
      setSelect(clickedPiece);
      setSelectedPos(pos);
      setStartPos(pos);
    }
  }

  const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
  if (!boardPieces || boardPieces.length === 0) return <Loading />;

  const navigateHistory = (direction: "prev" | "next") => {
    let newIndex = historyIndex;
    if (direction === "prev" && historyIndex > -1) {
      newIndex = historyIndex - 1;
    } else if (direction === "next" && historyIndex < moveHistory.length - 1) {
      newIndex = historyIndex + 1;
    } else {
      return;
    }

    setHistoryIndex(newIndex);

    const tempChess = new Chess();

    for (let i = 0; i <= newIndex; i++) {
      try {
        tempChess.move(moveHistory[i]);
      } catch (e) {
        console.error("Error replaying move:", e);
      }
    }

    const board = tempChess.board();
    const simPieces: PieceType[] = [];

    board.forEach((row, rowIndex) => {
      row.forEach((square, colIndex) => {
        if (square) {
          const position = `${columns[colIndex]}${8 - rowIndex}`;
          simPieces.push({
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

    setSimulationPieces(simPieces);
    setIsViewingHistory(newIndex < moveHistory.length - 1);
  };

  const exitHistoryView = () => {
    setHistoryIndex(moveHistory.length - 1);
    setIsViewingHistory(false);
    setSimulationPieces([]);
  };

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
      amIAtTurn &&
      myColor === piece.color &&
      gameStatus === "playing" &&
      !isViewingHistory;

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
        className={`square-tile ${isWhite ? "white-square" : "black-square"} ${isMoveFrom ? "move-from" : ""
          } ${isMoveTo ? "move-to" : ""} m-0 aspect-square relative ${eckenKlasse} flex items-center justify-center ${selected ? "ring-4 ring-blue-500" : ""
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

  const displayPieces = isViewingHistory ? simulationPieces : boardPieces;

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

      const piece = displayPieces.find((p) => p.position === pos);

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

      <div className="relative">
        <div
          className={`bg-[hsl(0,0%,90%)] ml-4 mt-4 grid gap-0 border-black border-2 w-fit h-fit rounded-[10px] p-2 ${!amIAtTurn || gameStatus === "waiting" || isViewingHistory
            ? "opacity-70"
            : ""
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
                        `${boardPieces.find((p) => p.position === activePiece)
                          ?.color
                        }_${boardPieces
                          .find((p) => p.position === activePiece)
                          ?.type.toLowerCase()}`
                        ]
                        : pieceImagesv1[
                        `${boardPieces.find((p) => p.position === activePiece)
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

        {moveHistory.length > 0 && (
          <div className="absolute bottom-2 -right-50 flex gap-2 bg-[#FCFCFC] rounded-[23.5px] shadow-lg p-2 px-3">
            <button
              onClick={() => navigateHistory("prev")}
              disabled={historyIndex <= -1}
              className="w-10 h-10 disabled:text-gray-400 rounded-lg font-bold text-lg transition-colors flex items-center justify-center"
              title="Vorheriger Zug"
            >
              <svg
                width="27"
                height="16"
                viewBox="0 0 27 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M25.073 8.00003H1.57304M1.57304 8.00003L10.073 1.00003M1.57304 8.00003L10.073 15"
                  stroke="#666666"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="flex items-center justify-center min-w-[60px] px-2 text-[24px] font-medium text-gray-700">
              {isViewingHistory ? (
                <span className="text-orange-600">
                  {historyIndex + 1}/{moveHistory.length}
                </span>
              ) : (
                <span className="text-[#43B600]">Live</span>
              )}
            </div>
            <button
              onClick={() => navigateHistory("next")}
              className="w-10 h-10 disabled:text-gray-400 rounded-lg font-bold text-lg transition-colors flex items-center justify-center"
              title="Nächster Zug"
            >
              <svg
                width="27"
                height="16"
                viewBox="0 0 27 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 8.00003L24.5 8.00003M24.5 8.00003L16 15M24.5 8.00003L16 1.00003"
                  stroke="#666666"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {isViewingHistory && (
              <button
                onClick={exitHistoryView}
                className="ml-2 px-3 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition-colors"
                title="Zurück zur aktuellen Position"
              >
                Live
              </button>
            )}
          </div>
        )}

        {isViewingHistory && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
            📖 History Modus
          </div>
        )}
      </div>

      <div className="ml-4 mt-4 p-3 bg-gray-200 rounded h-fit space-y-2 w-64 min-w-[16rem]">
        {gameInfo && (
          <p className="font-bold text-lg text-red-600 text-center animate-pulse">
            {gameInfo}
          </p>
        )}

        {gameStatus === "waiting" ? (
          <p className="font-semibold text-lg text-orange-600">
            ⏳ Warte auf zweiten Spieler...
          </p>
        ) : gameStatus === "ended" ? (
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
              className={`font-semibold text-lg ${amIAtTurn ? "text-green-600" : "text-red-600"
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
      <SocketComponent
        myColor={myColor}
        gameStatus={gameStatus as "playing" | "waiting" | "ended" | ""}
        setGameStatus={setGameStatus}
        currentRoom={currentRoom}
        onPlayerJoined={() => setGameStatus("playing")}
        gameInfo={gameInfo}
        setMyColor={setMyColor}
      />
    </div>
  );
}