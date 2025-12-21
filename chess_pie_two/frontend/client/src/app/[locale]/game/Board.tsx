"use client";
import Image from "next/image";
import { pieces, pieceImagesv2, pieceImagesv3, getPieceImage, PieceType } from "./Data";
import { useState, useEffect, useRef, Fragment } from "react";
import { useTranslations } from "next-intl";
import Loading from "@/app/loading";
import Back from "./Back";
import { Chess, type Square } from "chess.js";
import SocketComponent, { socket } from "./SocketComponent"; // ← HIER: socket importieren!
import BoardStyle from "./BoardStyle";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { ArrowLeft, ArrowRight, RotateCcw, Layers, History } from "lucide-react";
import "./Board.css";

const getGamePieceScale = (type: string) => {
  switch (type.toLowerCase()) {
    case "king": return 0.96;
    case "queen": return 0.94;
    case "bishop": return 0.88;
    case "knight": return 0.88;
    case "rook": return 0.82;
    case "pawn": return 0.78;
    default: return 0.85;
  }
};

export default function Board() {
  const t = useTranslations("Multiplayer");
  const [boardPieces, setBoardPieces] = useState<PieceType[]>(pieces);

  // Configure sensors to allow click events (drag only starts after 5px movement)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  const [boardStyle, setBoardStyle] = useState("v3");
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

  useEffect(() => {
    const savedStyle = localStorage.getItem("boardStyle");
    if (savedStyle === "v2" || savedStyle === "v3") {
      setBoardStyle(savedStyle);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("boardStyle", boardStyle);
  }, [boardStyle]);

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
      alert(`${t("invalidMove")}${data.reason}`);
    };

    const handleMove = (data: any) => {
      try {
        const result = chessRef.current.move({
          from: data.from,
          to: data.to,
          promotion: data.promotion,
        });

        if (!result) {
          console.warn("Local move failed, falling back to FEN (History might be lost)");
          chessRef.current.load(data.fen);
        }
      } catch (e) {
        console.error("Error executing move locally:", e);
        chessRef.current.load(data.fen);
      }

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
      const headerHeight = 100; // Safer estimate for header space
      const rows = 8;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      let finalBlockSize;
      // Conservative margin calculation:
      // Desktop uses standard 120px
      // Mobile needs more room for stacked info and history controls
      const safetyMargin = screenWidth < 640 ? 220 : 120;
      const maxHeightBlock = (screenHeight - headerHeight - safetyMargin) / rows;

      if (screenWidth < 640) {
        // Mobile: Fit to width with some padding
        const availableWidth = screenWidth - 24;
        const widthBlock = Math.floor(availableWidth / 8);
        // Use the smaller of width-based or height-based size
        // Ensure it doesn't get ridiculously small (min 25px per square = 200px board)
        finalBlockSize = Math.max(25, Math.min(widthBlock, maxHeightBlock));
      } else {
        let widthBlock;
        if (screenWidth >= 800) widthBlock = 80;
        else widthBlock = 60; // 600-800

        finalBlockSize = Math.max(10, Math.min(widthBlock, maxHeightBlock));
      }

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
    if (needConfirm && !confirm(t("confirmReset"))) return;

    // Notify server to delete the room
    socket.emit("reset_game");

    chessRef.current.reset();
    syncBoardFromChess();

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
      sessionStorage.removeItem("lastMoveFrom");
      sessionStorage.removeItem("lastMoveTo");
    }

    console.log("♻️ Board und Raum zurückgesetzt!");
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
    onClick,
  }: {
    piece: PieceType;
    size: number;
    amIAtTurn: boolean;
    onClick: () => void;
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
        onClick={(e) => {
          // Allow click to propagate even if drag listeners are present
          // e.stopPropagation(); // Do NOT stop propagation, or handle explicitly
          onClick();
        }}
      >
        <Image
          src={getPieceImage(boardStyle, piece.color, piece.type)}
          alt={`${piece.color} ${piece.type}`}
          height={piece.size}
          width={piece.size}
          unoptimized
          className="bg-transparent"
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
            onClick={() => onClick(pos)}
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

      const displayPiece = displayPieces.find((p) => p.position === pos);

      if (displayPiece) {
        displayPiece.size = blockSize * getGamePieceScale(displayPiece.type);
      }

      content.push(
        <SquareTile
          key={pos}
          pos={pos}
          isWhite={isWhite}
          eckenKlasse={eckenKlasse}
          piece={displayPiece}
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
  const currentTurn = chessRef.current.turn() === "w" ? t('white') : t('black');

  return (
    <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start min-h-screen pb-10">
      {showPromotionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-center">
              {t('promotionTitle')}
            </h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              {t('promotionSubtitle')}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => executePromotion("q")}
                className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Image
                  src={getPieceImage(boardStyle, myColor || "white", "queen")}
                  alt="Queen"
                  width={60}
                  height={60}
                  unoptimized
                  className="bg-transparent"
                />
                <p className="text-xs text-center mt-2">{t('queen')}</p>
              </button>
              <button
                onClick={() => executePromotion("r")}
                className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Image
                  src={getPieceImage(boardStyle, myColor || "white", "rook")}
                  alt="Rook"
                  width={60}
                  height={60}
                  unoptimized
                  className="bg-transparent"
                />
                <p className="text-xs text-center mt-2">{t('rook')}</p>
              </button>
              <button
                onClick={() => executePromotion("b")}
                className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Image
                  src={getPieceImage(boardStyle, myColor || "white", "bishop")}
                  alt="Bishop"
                  width={60}
                  height={60}
                  unoptimized
                  className="bg-transparent"
                />
                <p className="text-xs text-center mt-2">{t('bishop')}</p>
              </button>
              <button
                onClick={() => executePromotion("n")}
                className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Image
                  src={getPieceImage(boardStyle, myColor || "white", "knight")}
                  alt="Knight"
                  width={60}
                  height={60}
                  unoptimized
                  className="bg-transparent"
                />
                <p className="text-xs text-center mt-2">{t('knight')}</p>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-[800px]">
        <div className="relative">
          <div
            className={`bg-transparent lg:ml-4 mt-4 grid gap-0 border-black border-2 w-fit h-fit rounded-[10px] p-2 ${(!amIAtTurn && gameStatus === "playing") || gameStatus === "waiting" || isViewingHistory
              ? "opacity-80"
              : ""
              }`}
            style={{
              gridTemplateColumns: `repeat(8, ${blockSize}px)`,
            }}
          >
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
            >
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
                      src={getPieceImage(
                        boardStyle,
                        boardPieces.find((p) => p.position === activePiece)?.color || "white",
                        boardPieces.find((p) => p.position === activePiece)?.type || "Pawn"
                      )}
                      alt=""
                      height={blockSize * getGamePieceScale(boardPieces.find((p) => p.position === activePiece)?.type || "Pawn")}
                      width={blockSize * getGamePieceScale(boardPieces.find((p) => p.position === activePiece)?.type || "Pawn")}
                      unoptimized
                      className="bg-transparent"
                      style={{ pointerEvents: "none" }}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {isViewingHistory && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg z-50 flex items-center gap-2">
              <History size={18} />
              {t('historyMode')}
            </div>
          )}
        </div>

        {/* History Controls - Now ALWAYS below the board */}
        {moveHistory.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-2xl shadow-xl p-3 px-6 border border-gray-200 dark:border-gray-800 z-30 transition-all">
            <button
              onClick={() => navigateHistory("prev")}
              disabled={historyIndex <= -1}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-accent hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 transition-all shadow-sm group"
              title={t('previousMove')}
            >
              <ArrowLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="flex flex-col items-center justify-center min-w-[100px] border-x border-gray-200 dark:border-gray-700 px-4">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-0.5">
                {isViewingHistory ? t('historyMode') : t('live')}
              </span>
              <div className="text-xl font-black tabular-nums">
                {isViewingHistory ? (
                  <span className="text-orange-500">
                    {historyIndex + 1} <span className="text-gray-400 font-medium">/</span> {moveHistory.length}
                  </span>
                ) : (
                  <span className="text-green-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {t('live')}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => navigateHistory("next")}
              disabled={!isViewingHistory}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-accent hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 transition-all shadow-sm group"
              title={t('nextMove')}
            >
              <ArrowRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            {isViewingHistory && (
              <button
                onClick={exitHistoryView}
                className="ml-2 flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
              >
                <RotateCcw size={16} />
                {t('live')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="lg:ml-4 mt-4 p-3 bg-gray-200 text-gray-800 rounded h-fit space-y-2 w-full max-w-[90vw] lg:w-64 min-w-[16rem]">
        {gameInfo && (
          <p className="font-bold text-lg text-red-600 text-center animate-pulse">
            {gameInfo}
          </p>
        )}

        {/* Piece Selection UI */}
        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-gray-300 dark:border-gray-700">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70 flex items-center gap-2">
            <Layers size={16} />
            Design
          </p>
          <BoardStyle currentStyle={boardStyle} onStyleChange={setBoardStyle} />
        </div>

        {gameStatus === "waiting" ? (
          <p className="font-semibold text-lg text-orange-600">
            ⏳ {t('waiting')}
          </p>
        ) : gameStatus === "ended" ? (
          <div className="space-y-2">
            <p className="font-semibold text-lg text-red-600">
              🏁 {t('ended')}
            </p>
            <button
              onClick={() => resetBoard(true)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 font-semibold"
            >
              🔄 {t('resetBoard')}
            </button>
          </div>
        ) : (
          <>
            <p
              className={`font-semibold text-lg ${amIAtTurn ? "text-green-600" : "text-red-600"
                }`}
            >
              {amIAtTurn ? `✅ ${t('yourTurn')}` : `⏳${t('turnOf')}`}
            </p>
          </>
        )}

        {myColor && (
          <p className="text-sm text-gray-600 mt-1">
            {t('youPlay')} {myColor === "white" ? `${t('white')} ⚪` : `${t('black')} ⚫`}
          </p>
        )}

        {currentRoom && (
          <p className="text-xs text-gray-500 mt-2 break-all">
            {t('room')}{currentRoom.substring(0, 12)}...
          </p>
        )}

        {moveCount >= 100 && (
          <p className="text-xs text-orange-600 font-semibold mt-2">
            ⚠️ {t('movesWithoutPawn', { count: Math.floor(moveCount / 2) })}
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