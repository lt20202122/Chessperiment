"use client";
import Image from "next/image";
import { pieces, getPieceImage, PieceType } from "./Data";
import { Hand, MessageSquare, Info, History, Shield, Trophy, User, Gamepad2, Settings, ChevronLeft, ChevronRight, X, User2, MonitorOff, UserPlus } from "lucide-react";
import { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Back from "./Back";
import GameEndEffect from "./GameEndEffect";
import GameSidebar from "./GameSidebar";
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
  TouchSensor,
} from "@dnd-kit/core";
import Toast from "./Toast";
import "./Board.css";
import { useSocket } from "@/context/SocketContext";
import filter from "leo-profanity";
import { Chess } from "chess.js";
import { useStockfish } from "@/hooks/useStockfish";

type Square = string;

// Helpers
const parseFen = (fen: string): PieceType[] => {
  if (!fen || fen.trim() === "") return pieces;
  const [placement] = fen.split(' ');
  const rows = placement.split('/');
  const newPieces: PieceType[] = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  rows.forEach((row, rowIndex) => {
    let colIndex = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        colIndex += parseInt(char);
      } else {
        const color = char === char.toUpperCase() ? 'white' : 'black';
        const typeMap: Record<string, string> = {
          'p': 'Pawn', 'r': 'Rook', 'n': 'Knight', 'b': 'Bishop', 'q': 'Queen', 'k': 'King'
        };
        const type = typeMap[char.toLowerCase()];
        const position = `${files[colIndex]}${8 - rowIndex}`;
        newPieces.push({
          position,
          type: type as any,
          color,
          size: 80 // Default, updated later
        });
        colIndex++;
      }
    }
  });
  return newPieces;
};

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

const DraggablePiece = memo(function DraggablePiece({
  piece,
  size,
  amIAtTurn,
  onClick,
  boardStyle,
  isViewingHistory,
  gameStatus,
  myColor,
  gameMode,
}: {
  piece: PieceType;
  size: number;
  amIAtTurn: boolean;
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  boardStyle: string;
  isViewingHistory: boolean;
  gameStatus: string;
  myColor: "white" | "black" | null;
  gameMode: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: piece.position,
      data: piece,
    });
  const isMyPiece = myColor ? piece.color === myColor : true;

  const canDrag =
    amIAtTurn &&
    isMyPiece &&
    gameStatus === "playing" &&
    (!isViewingHistory || gameMode === 'computer');

  const style: React.CSSProperties = {
    fontSize: size,
    cursor: canDrag ? "grab" : "default",
    userSelect: "none",
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: isDragging ? 0 : 1,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : "none",
    zIndex: 20,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      style={style}
      onClick={(e) => {
        // Only stop propagation if we are dragging/active
        onClick(e);
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
        priority
      />
    </div>
  );
});

const SquareTile = memo(function SquareTile({
  pos,
  isWhite,
  piece,
  blockSize,
  selected,
  isMoveFrom,
  isMoveTo,
  onClick,
  onContextMenu,
  boardStyle,
  isViewingHistory,
  gameStatus,
  myColor,
  amIAtTurn,
  squareRefs,
  gameMode,
}: {
  pos: string;
  isWhite: boolean;
  piece?: PieceType;
  blockSize: number;
  selected: boolean;
  isMoveFrom: boolean;
  isMoveTo: boolean;
  onClick: (p: string) => void;
  onContextMenu: (p: string) => void;
  boardStyle: string;
  isViewingHistory: boolean;
  gameStatus: string;
  myColor: "white" | "black" | null;
  amIAtTurn: boolean;
  squareRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  gameMode: string;
}) {
  const { setNodeRef } = useDroppable({ id: pos });

  const combinedRef = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    squareRefs.current[pos] = el;
  };

  return (
    <div
      key={pos}
      ref={combinedRef}
      className={`${isWhite ? "white-square" : "black-square"} ${isMoveFrom ? "move-from" : ""} ${isMoveTo ? "move-to" : ""} m-0 aspect-square relative flex items-center justify-center ${selected ? "ring-4 ring-inset ring-blue-500" : ""}`}
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
          amIAtTurn={amIAtTurn}
          onClick={(e) => {
            e.stopPropagation();
            onClick(pos);
          }}
          boardStyle={boardStyle}
          isViewingHistory={isViewingHistory}
          gameStatus={gameStatus}
          myColor={myColor}
          gameMode={gameMode}
        />
      )}
    </div>
  );
});

export default function Board({
  initialRoomId,
  gameModeVar,
  initialFen,
  mode,
}: {
  initialRoomId?: string;
  gameModeVar?: "online" | "computer" | "local";
  initialFen?: string;
  mode?: "create" | "join" | "computer";
}) {
  const t = useTranslations("Multiplayer");
  const router = useRouter();
  const [boardPieces, setBoardPieces] = useState<PieceType[]>(pieces);
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 10,
    },
  });
  const sensors = useSensors(pointerSensor, touchSensor);
  const socket = useSocket();

  const [boardStyle, setBoardStyle] = useState("v3");
  const [blockSize, setBlockSize] = useState(80);
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<"waiting" | "playing" | "ended" | "">("");
  const [myColor, setMyColor] = useState<"white" | "black" | null>(null);
  const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>('w');
  const [redMarkedSquares, setRedMarkedSquares] = useState<Set<string>>(new Set());
  const [lastMoveFrom, setLastMoveFrom] = useState<string | null>(null);
  const [lastMoveTo, setLastMoveTo] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [historyFens, setHistoryFens] = useState<string[]>([]);
  const [historyMoves, setHistoryMoves] = useState<{ from: string; to: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const squareRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activePiece, setActivePiece] = useState<any>(null);

  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string; } | null>(null);

  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [currentRoom, setCurrentRoom] = useState(initialRoomId || "");
  const [gameInfo, setGameInfo] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [gameMode, setGameMode] = useState<"online" | "computer" | "local">(gameModeVar || 'local');
  const [isSearching, setIsSearching] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const [drawOffer, setDrawOffer] = useState<"pending" | "offered" | null>(null);

  // --- Stockfish & Local Logic ---
  const [chess] = useState(() => new Chess());
  const [difficulty, setDifficulty] = useState(1200);

  const updateBoardState = useCallback((fen: string) => {
    const newPieces = parseFen(fen);
    setBoardPieces(newPieces);
    const parts = fen.split(' ');
    if (parts[1]) setCurrentTurn(parts[1] as 'w' | 'b');
  }, []);

  const startComputerGame = useCallback((elo = 1200) => {
    setGameMode("computer");
    setGameStatus("playing");
    setMyColor("white");
    chess.reset();
    const fen = chess.fen();
    updateBoardState(fen);
    setMoveHistory([]);
    setHistoryFens([]);
    setHistoryMoves([]);
    setHistoryIndex(-1);
    setIsViewingHistory(false);
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setCurrentTurn('w');
    setDifficulty(elo);

    // Join server room for computer games to enable server-side state tracking
    const playerId = localStorage.getItem("chess_player_id") || "unknown";
    const compRoomId = `COMPUTER-${playerId}-${Date.now()}`;
    setCurrentRoom(compRoomId);
    if (socket) {
      socket.emit("join_room", { roomId: compRoomId, isComputer: true });
    }
  }, [chess, updateBoardState, socket]);

  // We need a stable callback for stockfish
  const onBestMove = useCallback((move: string) => {
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const promotion = move.length > 4 ? move.substring(4, 5) : undefined;
    try {
      const result = chess.move({ from, to, promotion: promotion || 'q' });
      if (result) {
        const newFen = chess.fen();
        updateBoardState(newFen);
        new Audio("/sounds/move-self.mp3").play().catch(() => { });

        setLastMoveFrom(from);
        setLastMoveTo(to);
        const san = result.san;
        setMoveHistory(prev => {
          const next = [...prev, san];
          setHistoryIndex(next.length - 1);
          return next;
        });
        setHistoryFens(prev => [...prev, newFen]);
        setHistoryMoves(prev => [...prev, { from, to, san }]);

        if (chess.isGameOver()) {
          if (chess.isCheckmate()) {
            setGameResult(chess.turn() === myColor?.charAt(0) ? 'loss' : 'win');
            setGameInfo(t("checkmate"));
          } else {
            setGameResult('draw');
            setGameInfo(t("draw"));
          }
          setTimeout(() => setGameStatus("ended"), 2000);
        }
      }
    } catch (e) { }
  }, [chess, updateBoardState, myColor, t]);

  const { requestMove, isReady } = useStockfish(currentRoom, difficulty, onBestMove);

  useEffect(() => {
    if (gameMode === 'computer' && isReady && gameStatus === 'playing') {
      const isComputerTurn = chess.turn() !== (myColor === 'white' ? 'w' : 'b');
      if (isComputerTurn) {
        requestMove(chess.fen());
      }
    }
  }, [isReady, currentTurn, gameMode, gameStatus, myColor, chess, requestMove]);

  useEffect(() => {
    // Auto-start computer game if mode is computer and status is empty/waiting
    if (gameMode === 'computer' && (gameStatus === "" || gameStatus === "waiting")) {
      let elo = 1200;
      if (currentRoom && currentRoom.startsWith("computer-")) {
        const parts = currentRoom.split("-");
        if (parts[1]) elo = parseInt(parts[1]) || 1200;
      }
      startComputerGame(elo);
    } else if (initialRoomId && gameStatus === "" && gameMode !== 'computer') {
      setGameStatus("waiting");
    }
  }, [initialRoomId, gameStatus, gameMode, currentRoom, startComputerGame]);

  useEffect(() => {
    if (!socket || gameMode !== "online") return;

    const onMove = (data: any) => {
      if (data.fen) {
        updateBoardState(data.fen);
        setHistoryFens(prev => [...prev, data.fen]);
      }
      setLastMoveFrom(data.from);
      setLastMoveTo(data.to);
      if (data.san) {
        setMoveHistory(prev => {
          const next = [...prev, data.san];
          setHistoryIndex(next.length - 1);
          return next;
        });
        setHistoryMoves(prev => [...prev, { from: data.from, to: data.to, san: data.san }]);
      }
      if (data.gameStatus) setGameStatus(data.gameStatus);
      setIsViewingHistory(false);
      new Audio("/sounds/move-self.mp3").play().catch(() => { });
    };

    const onGameStateInit = (data: any) => {
      if (data.fen) {
        updateBoardState(data.fen);
      }

      if (data.color !== undefined) {
        const mappedColor = data.color === "white" ? "white" : (data.color === "black" ? "black" : null);
        setMyColor(mappedColor);
      }

      const newStatus = data.status || data.gameStatus;
      if (newStatus) {
        setGameStatus(newStatus);
        if (newStatus === "playing") { setPlayerCount(2); setIsSearching(false); }
        else if (newStatus === "waiting") { setPlayerCount(1); }
      }

      if (data.roomId) {
        setCurrentRoom(data.roomId);
      }

      if (data.history) {
        setMoveHistory(data.history);
        setHistoryIndex(data.history.length - 1);
      }

      if (data.chatMessages) {
        setChatMessages(data.chatMessages.map((m: any) => filterMessage(m.message)));
      }
    };

    socket.on("move", onMove);
    socket.on("match_found", (data: any) => {
      setIsSearching(false);
      onGameStateInit(data);
      setGameStatus("playing");
      setPlayerCount(2);
    });
    socket.on("start_game", (data: any) => {
      onGameStateInit(data);
      setGameStatus("playing");
      setPlayerCount(2);
    });
    socket.on("rejoin_game", (data: any) => {
      onGameStateInit(data);
    });
    socket.on("room_created", (data: any) => {
      setCurrentRoom(data.roomId);
      setMyColor("white");
      setGameStatus("waiting");
      setPlayerCount(1);
    });
    socket.on("joined_room", (data: any) => {
      setCurrentRoom(data.roomId);
      setMyColor("black");
      setGameStatus("waiting");
      setPlayerCount(2);
    });
    socket.on("game_ended", (data: any) => {
      if (data.result === "0") setGameResult("draw");
      else {
        setMyColor(curr => {
          const iWon = (data.result === "w" && curr === "white") || (data.result === "b" && curr === "black");
          setGameResult(iWon ? "win" : "loss");
          return curr;
        });
      }
      setGameInfo(data.reason || t("gameEnded"));
      setDrawOffer(null);
      setTimeout(() => {
        setGameStatus("ended");
      }, 2000);
    });
    socket.on("opp_disconnected", () => {
      setGameInfo(t("opponentDisconnected"));
      setPlayerCount(1);
      setDrawOffer(null);
    });
    socket.on("error", (data: any) => {
      setGameInfo(`${t("error")}${data.message}`);
      setToastMessage(`${t("error")}${data.message}`);
      setShowToast(true);
    });
    socket.on("room_not_found", (data: any) => {
      setGameInfo(`${t("reasons.room_not_found")}`);
      setToastMessage(`${t("reasons.room_not_found")}`);
      setShowToast(true);
      setGameStatus("ended");
    });
    socket.on("room_full", () => {
      setToastMessage(t("roomFull"));
      setShowToast(true);
      setGameStatus("ended");
    });
    socket.on("receive_fen", (d: any) => updateBoardState(d.board_fen));
    socket.on("promotion_needed", (d: any) => {
      setPromotionMove({ from: d.from, to: d.to });
      setShowPromotionDialog(true);
    });
    socket.on("promotion_done", () => {
      setShowPromotionDialog(false);
      setPromotionMove(null);
    });
    socket.on("draw_offered", () => {
      setDrawOffer("pending");
      setToastMessage(t("drawOfferReceived"));
      setShowToast(true);
    });
    socket.on("draw_declined", () => {
      setDrawOffer(null);
      setToastMessage(t("drawOfferDeclined"));
      setShowToast(true);
    });
    socket.on("draw_accepted", () => {
      setDrawOffer(null);
      setGameStatus("ended");
      setGameResult("draw");
      setGameInfo(t("drawAccepted"));
      setToastMessage(t("drawAccepted"));
      setShowToast(true);
    });

    return () => {
      socket.off("move"); socket.off("match_found"); socket.off("start_game");
      socket.off("rejoin_game"); socket.off("room_created"); socket.off("joined_room");
      socket.off("game_ended"); socket.off("opp_disconnected"); socket.off("error");
      socket.off("receive_fen"); socket.off("promotion_needed"); socket.off("promotion_done");
      socket.off("draw_offered"); socket.off("draw_declined"); socket.off("draw_accepted");
    };
  }, [socket, gameMode, updateBoardState, t]);

  useEffect(() => {
    if (sessionStatus === "loading" || !socket) return;
    const register = () => {
      let pId = localStorage.getItem("chess_player_id");

      if (!pId && session?.user?.id) {
        pId = session.user.id;
        localStorage.setItem("chess_player_id", pId);
      }

      if (!pId) {
        pId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem("chess_player_id", pId);
      }

      socket.emit("register_player", { playerId: pId });

      // Handle room joining: computer games need server-side tracking too
      if (initialRoomId) {
        const isComputerMode = gameModeVar === 'computer' || gameMode === 'computer';
        if (mode === 'create') {
          socket.emit("create_room", { roomId: initialRoomId });
        } else {
          socket.emit("join_room", {
            roomId: initialRoomId,
            isComputer: isComputerMode
          });
        }
      }
    };
    register();
    socket.on("connect", register);
    return () => { socket.off("connect", register); };
  }, [session?.user?.id, sessionStatus, socket, initialRoomId, gameMode, gameModeVar]);

  useEffect(() => {
    if (initialFen) updateBoardState(initialFen);
  }, [initialFen, updateBoardState]);

  const boardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boardContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Responsive padding: smaller on small screens to maximize board size
        const padding = width < 600 ? 32 : 96;
        const availW = width - padding;
        const availH = height - padding;

        // Ensure non-negative
        const minDim = Math.max(0, Math.min(availW, availH));
        const calculated = Math.floor(minDim / 8);

        // Clamp between 20 and 120px per square
        setBlockSize(Math.max(Math.min(calculated, 120), 20));
      }
    });

    resizeObserver.observe(boardContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [gameStatus, isSearching]); // Re-run when layout changes


  const displayPieces = useMemo(() => {
    const activeFEN = isViewingHistory && historyIndex >= 0 ? historyFens[historyIndex] : (isViewingHistory && historyIndex === -1 ? (initialFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") : null);
    return activeFEN ? parseFen(activeFEN) : boardPieces;
  }, [isViewingHistory, historyIndex, historyFens, initialFen, boardPieces]);

  const activeTurn = useMemo(() => {
    const activeFEN = isViewingHistory && historyIndex >= 0 ? historyFens[historyIndex] : (isViewingHistory && historyIndex === -1 ? (initialFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") : null);
    return activeFEN ? (activeFEN.split(' ')[1] as 'w' | 'b') : currentTurn;
  }, [isViewingHistory, historyIndex, historyFens, initialFen, currentTurn]);

  const getPieceAt = useCallback((pos: string) => displayPieces.find(p => p.position === pos), [displayPieces]);

  const executePromotion = (type: string) => {
    if (!promotionMove) return;
    const promoMap: any = { 'Queen': 'q', 'Rook': 'r', 'Bishop': 'b', 'Knight': 'n' };
    const code = promoMap[type] || type.toLowerCase();

    console.log(`[Board] Executing promotion: ${type} (${code}) for move: ${promotionMove.from}->${promotionMove.to}`);

    if (gameMode === "online") {
      // Optimistic Visual Update for Promotion
      const mover = boardPieces.find(p => p.position === promotionMove.from);
      if (mover) {
        const newPieces = boardPieces
          .filter(p => p.position !== promotionMove.to && p.position !== promotionMove.from)
          .map(p => ({ ...p }));

        const promoTypeMap: any = { 'q': 'Queen', 'r': 'Rook', 'b': 'Bishop', 'n': 'Knight' };
        newPieces.push({
          ...mover,
          position: promotionMove.to,
          type: promoTypeMap[code] || 'Queen'
        } as PieceType);

        setBoardPieces(newPieces);
        setLastMoveFrom(promotionMove.from);
        setLastMoveTo(promotionMove.to);
        setCurrentTurn(prev => prev === 'w' ? 'b' : 'w');
        new Audio("/sounds/move-self.mp3").play().catch(() => { });
      }

      if (socket) {
        socket.emit("move", { from: promotionMove.from, to: promotionMove.to, promotion: code });
      }
    } else {
      executeMove(promotionMove.from, promotionMove.to, code);
    }
    setShowPromotionDialog(false); setPromotionMove(null);
  };

  const executeMove = (from: string, to: string, promotion?: string) => {
    if (gameMode === "online") {
      // Optimistic Visual Update
      const mover = boardPieces.find(p => p.position === from);
      if (mover) {
        const newPieces = boardPieces
          .filter(p => p.position !== to && p.position !== from)
          .map(p => ({ ...p }));

        newPieces.push({ ...mover, position: to } as PieceType);

        setBoardPieces(newPieces);
        setLastMoveFrom(from);
        setLastMoveTo(to);
        setCurrentTurn(prev => prev === 'w' ? 'b' : 'w');
        new Audio("/sounds/move-self.mp3").play().catch(() => { });
      }

      if (socket) socket.emit("move", { from, to, promotion });
      return true;
    }

    // Computer / Local Mode
    if (gameMode === 'computer' || gameMode === 'local') {
      try {
        // Handle history rewrite for computer mode
        if (isViewingHistory && gameMode === 'computer') {
          let fenToLoad = initialFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
          if (historyIndex >= 0) {
            fenToLoad = historyFens[historyIndex];
          }
          chess.load(fenToLoad);

          const moveResult = chess.move({ from, to, promotion: promotion || 'q' });
          if (moveResult) {
            const newFen = chess.fen();
            updateBoardState(newFen);
            new Audio("/sounds/move-self.mp3").play().catch(() => { });
            const san = moveResult.san;

            const sliceIndex = historyIndex + 1;

            setMoveHistory(prev => [...prev.slice(0, sliceIndex), san]);
            setHistoryFens(prev => [...prev.slice(0, sliceIndex), newFen]);
            setHistoryMoves(prev => [...prev.slice(0, sliceIndex), { from, to, san }]);

            setHistoryIndex(sliceIndex);
            setIsViewingHistory(false);
            setLastMoveFrom(from);
            setLastMoveTo(to);
            setSelectedPos(null);

            if (chess.isGameOver()) {
              if (chess.isCheckmate()) {
                setGameResult(chess.turn() === myColor?.charAt(0) ? 'loss' : 'win');
                setGameInfo(t("checkmate"));
              } else {
                setGameResult('draw');
                setGameInfo(t("draw"));
              }
              setTimeout(() => setGameStatus("ended"), 2000);
            }
            return true;
          }
          // If move failed, reload live state to be safe, though activeFEN handles view
          // But since we failed, we might want to revert chess instance?
          // Ideally we just return false.
          return false;
        }

        const moveResult = chess.move({ from, to, promotion: promotion || 'q' });
        if (moveResult) {
          const newFen = chess.fen();
          updateBoardState(newFen);
          new Audio("/sounds/move-self.mp3").play().catch(() => { });

          const san = moveResult.san;
          setMoveHistory(prev => {
            const next = [...prev, san];
            setHistoryIndex(next.length - 1);
            return next;
          });
          setHistoryFens(prev => [...prev, newFen]);
          setHistoryMoves(prev => [...prev, { from, to, san }]);

          // Sync with server for computer games (so server knows the board state)
          if (gameMode === 'computer' && socket) {
            socket.emit("move", { from, to, promotion });
          }

          if (chess.isGameOver()) {
            if (chess.isCheckmate()) {
              setGameResult(chess.turn() === myColor?.charAt(0) ? 'loss' : 'win');
              setGameInfo(t("checkmate"));
            } else {
              setGameResult('draw');
              setGameInfo(t("draw"));
            }
            setTimeout(() => setGameStatus("ended"), 2000);
          }
          setIsViewingHistory(false);
          setLastMoveFrom(from); setLastMoveTo(to); setSelectedPos(null);
          return true;
        }
      } catch (e) { return false; }
    }
    return false;
  };

  const handleDragStart = (e: DragStartEvent) => { setActivePiece(e.active.id as string); setSelectedPos(e.active.id as string); };
  const handleDragEnd = (e: DragEndEvent) => {
    setActivePiece(null);
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const from = active.id as string, to = over.id as string;
      const p = getPieceAt(from);
      const toRank = parseInt(to.match(/\d+/)?.[0] || "0", 10);
      const boardHeight = 8; // Default for chess.js in this component
      if (p?.type === 'Pawn' && (toRank === boardHeight || toRank === 1)) {
        setPromotionMove({ from, to }); setShowPromotionDialog(true);
      } else executeMove(from, to);
    }
  };

  const handlePieceSelect = useCallback((pos: string) => {
    setRedMarkedSquares(new Set()); // Clear red highlights on any left-click
    if (gameStatus !== "playing") return;
    if (isViewingHistory && gameMode !== 'computer') return;

    // Determine the relevant pieces and turn based on history view or live view
    const effectivePieces = displayPieces;
    const effectiveTurn = activeTurn;

    // Helper to get piece from the effective set
    const getEffectivePieceAt = (pPos: string) => effectivePieces.find(p => p.position === pPos);

    if (!selectedPos) {
      const p = getEffectivePieceAt(pos);
      if (p && (p.color === 'white' ? 'w' : 'b') === effectiveTurn) {
        if (!myColor || p.color === myColor) setSelectedPos(pos);
      }
    } else {
      if (selectedPos === pos) setSelectedPos(null);
      else {
        const p = getEffectivePieceAt(selectedPos);
        if (!p) return;
        const toRank = parseInt(pos.match(/\d+/)?.[0] || "0", 10);
        const boardHeight = 8;
        if (p.type === 'Pawn' && (toRank === boardHeight || toRank === 1)) {
          setPromotionMove({ from: selectedPos, to: pos }); setShowPromotionDialog(true);
        } else {
          const target = getEffectivePieceAt(pos);
          if (target && target.color === p.color) setSelectedPos(pos);
          else executeMove(selectedPos, pos);
        }
      }
    }
  }, [gameStatus, isViewingHistory, selectedPos, displayPieces, activeTurn, myColor, executeMove, gameMode, historyIndex, historyFens, initialFen]);

  const navigateHistory = (dir: "prev" | "next" | "start" | "end") => {
    if (moveHistory.length === 0) return;

    let idx = historyIndex;
    if (dir === "start") idx = -1;
    else if (dir === "prev") idx = Math.max(-1, historyIndex - 1);
    else if (dir === "next") idx = Math.min(moveHistory.length - 1, historyIndex + 1);
    else if (dir === "end") idx = moveHistory.length - 1;

    if (idx === moveHistory.length - 1) {
      setIsViewingHistory(false);
    } else {
      setIsViewingHistory(true);
    }
    setHistoryIndex(idx);
  };

  const exitHistoryView = () => { setIsViewingHistory(false); setHistoryIndex(moveHistory.length - 1); };

  const onMoveClick = (index: number) => {
    if (index === moveHistory.length - 1) {
      setIsViewingHistory(false);
    } else {
      setIsViewingHistory(true);
    }
    setHistoryIndex(index);
  };


  const handleResign = () => {
    if (gameMode === 'computer' || gameMode === 'local') {
      setGameResult('loss');
      setGameInfo(t("youLost"));
      setGameStatus("ended");
    } else {
      if (socket) socket.emit("resign");
    }
  };

  const handleDeclineDraw = () => { if (socket && drawOffer === "pending") { socket.emit("decline_draw"); setDrawOffer(null); setToastMessage(t("drawOfferDeclinedByYou")); setShowToast(true); } };
  const handleAcceptDraw = () => { if (socket && drawOffer === "pending") { socket.emit("accept_draw"); setDrawOffer(null); } };

  const handleContextMenu = useCallback((p: string) => {
    setRedMarkedSquares(prev => {
      const n = new Set(prev);
      if (n.has(p)) n.delete(p);
      else n.add(p);
      return n;
    });
  }, []);

  const filterMessage = (message: string) => {
    return filter.clean(message);
  };

  const handleSendMessage = (message: string) => {
    if (filter.check(message)) {
      setToastMessage("Oh no, you can't say that word because it's a bad word.");
      setShowToast(true);
      return;
    }
    if (socket) {
      socket.emit("chat_message", { message });
    }
  };

  useEffect(() => {
    if (!socket) return;
    const onChat = (data: any) => setChatMessages(p => [...p, filterMessage(data.message)]);
    const onSearchStarted = () => setIsSearching(true);
    const onSearchCancelled = () => setIsSearching(false);

    socket.on("chat_message", onChat);
    socket.on("quick_search_started", onSearchStarted);
    socket.on("search_cancelled", onSearchCancelled);
    return () => {
      socket.off("chat_message", onChat);
      socket.off("quick_search_started", onSearchStarted);
      socket.off("search_cancelled", onSearchCancelled);
    };
  }, [socket]);

  const boardContent = [];
  const rRange = myColor === "black" ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cRange = myColor === "black" ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  const historyMove = isViewingHistory && historyIndex >= 0 ? historyMoves[historyIndex] : null;

  for (const i of rRange) {
    for (const a of cRange) {
      const pos = `${files[a]}${8 - i}`;
      const isWhiteSq = (i + a) % 2 === 0;
      const piece = displayPieces.find(p => p.position === pos);
      if (piece) piece.size = blockSize * getGamePieceScale(piece.type);

      const isMoveFrom = isViewingHistory ? historyMove?.from === pos : lastMoveFrom === pos;
      const isMoveTo = isViewingHistory ? historyMove?.to === pos : lastMoveTo === pos;

      const amIAtTurn = gameStatus === "playing" && (
        (!isViewingHistory && (myColor ? currentTurn === (myColor === "white" ? "w" : "b") : gameMode === 'local')) ||
        (isViewingHistory && gameMode === 'computer' && (myColor ? activeTurn === (myColor === "white" ? "w" : "b") : false))
      );

      boardContent.push(
        <SquareTile
          key={pos} pos={pos} isWhite={isWhiteSq} piece={piece} blockSize={blockSize}
          selected={selectedPos === pos} isMoveFrom={isMoveFrom} isMoveTo={isMoveTo}
          onClick={handlePieceSelect} onContextMenu={handleContextMenu}
          boardStyle={boardStyle} isViewingHistory={isViewingHistory} gameStatus={gameStatus} myColor={myColor}
          amIAtTurn={amIAtTurn}
          squareRefs={squareRefs}
          gameMode={gameMode}
        />
      );
    }
  }

  const markerOverlay = Array.from(redMarkedSquares).map(pos => {
    const el = squareRefs.current[pos];
    if (!el) return null;
    return <div key={`red-${pos}`} className="absolute z-10 pointer-events-none bg-red-500/40 rounded-sm" style={{ width: blockSize, height: blockSize, left: el.offsetLeft, top: el.offsetTop }} />;
  });

  return (
    <div className="flex flex-col lg:flex-row h-dvh w-full overflow-hidden">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex flex-col w-full h-full">
          {/* Top/Center content area */}
          <div className={`flex-1 flex flex-col items-center p-2 w-full overflow-hidden ${gameStatus === "playing" ? "justify-center" : "justify-center"}`}>

            {(gameStatus === "" && !isSearching) ? (
              <div className="text-center p-6 lg:p-12 bg-white dark:bg-stone-900 rounded-3xl lg:rounded-[3rem] shadow-2xl border border-stone-200 dark:border-stone-800 max-w-lg w-full animate-in zoom-in duration-500 my-auto mx-4">
                <h1 className="text-3xl lg:text-6xl font-black mb-6 lg:mb-8 text-stone-900 dark:text-white uppercase tracking-tighter italic">Chess PIE</h1>
                <button
                  onClick={() => { if (socket) { setIsSearching(true); socket.emit("find_match"); } }}
                  className="w-full py-4 lg:py-7 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-2xl lg:rounded-4xl font-black text-lg lg:text-xl shadow-xl hover:shadow-orange-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {t("quickPlay")}
                </button>
                <div className="mt-6 lg:mt-8 flex flex-col gap-3 lg:gap-4">
                  <button onClick={() => { if (socket) socket.emit("create_room"); }} className="text-stone-500 dark:text-stone-400 font-bold hover:text-amber-500 transition tracking-widest text-[10px] lg:text-sm uppercase">{t("createPrivateRoom")}</button>
                  <button onClick={() => startComputerGame()} className="text-stone-500 dark:text-stone-400 font-bold hover:text-green-500 transition tracking-widest text-[10px] lg:text-sm uppercase">{t("vsStockfish")}</button>
                </div>
              </div>
            ) : isSearching ? (
              <div className="flex flex-col items-center justify-center p-8 lg:p-12 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl rounded-4xl border border-gray-200 dark:border-white/10 shadow-2xl max-w-sm lg:max-w-lg w-full my-auto mx-4 select-none caret-transparent">
                <div className="w-12 h-12 lg:w-20 lg:h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-6 lg:mb-8" />
                <h2 className="text-xl lg:text-2xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tight text-center">{t("findingMatch")}</h2>
                <p className="text-stone-400 text-xs lg:text-sm font-medium mb-6 lg:mb-8 text-center">{t("searchingText")}</p>
                <button onClick={() => { if (socket) { setIsSearching(false); socket.emit("cancel_search"); } }} className="w-full lg:w-auto px-10 py-3 lg:py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all border border-red-500/30">{t("cancelSearch")}</button>
              </div>
            ) : (
              <div className="flex flex-col w-full h-full items-center justify-center p-2 lg:p-4">
                {/* Board Container - Flexible area */}
                <div
                  ref={boardContainerRef}
                  className="flex-1 w-full h-full flex items-center justify-center min-h-0 overflow-hidden touch-none"
                >
                  <div className="relative shadow-2xl rounded-xl bg-stone-300 dark:bg-stone-800 p-1 lg:p-2 animate-in zoom-in duration-700">
                    <div className="grid grid-cols-8 overflow-hidden rounded-lg shadow-inner" style={{ width: blockSize * 8, height: blockSize * 8 }}>
                      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                        {boardContent}
                        {markerOverlay}
                        <DragOverlay dropAnimation={null}>
                          {activePiece ? (
                            <div style={{ width: blockSize, height: blockSize, display: 'flex', alignItems: 'center', justifyItems: 'center', pointerEvents: 'none' }}>
                              <Image src={getPieceImage(boardStyle, getPieceAt(activePiece)?.color || 'white', getPieceAt(activePiece)?.type || 'Pawn')} alt="" width={blockSize} height={blockSize} unoptimized />
                            </div>
                          ) : null}
                        </DragOverlay>
                      </DndContext>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <GameSidebar
        myColor={myColor} moveHistory={moveHistory} historyIndex={historyIndex}
        navigateHistory={navigateHistory} exitHistoryView={exitHistoryView} isViewingHistory={isViewingHistory}
        chatMessages={chatMessages} onSendMessage={handleSendMessage}
        playerCount={playerCount} currentRoom={currentRoom} gameInfo={gameInfo} gameStatus={gameStatus as any}
        onResign={handleResign} onOfferDraw={() => { if (socket) socket.emit("offer_draw"); }}
        onStartComputerGame={startComputerGame} gameMode={gameMode} setGameMode={setGameMode}
        currentTurn={currentTurn} onLeaveGame={() => { setGameStatus(""); setIsSearching(false); window.location.href = '/game'; }}
        onMoveClick={onMoveClick}
        boardPieces={displayPieces}
      />

      {showPromotionDialog && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-2xl border border-stone-200 dark:border-stone-800 max-w-md w-full text-center">
            <h3 className="text-3xl font-black mb-8 dark:text-white uppercase tracking-tighter">Promotion</h3>
            <div className="grid grid-cols-2 gap-6">
              {['Queen', 'Rook', 'Bishop', 'Knight'].map(t => (
                <button key={t} onClick={() => executePromotion(t)} className="group p-6 bg-stone-100 dark:bg-stone-800/50 rounded-3xl hover:bg-stone-200 transition-all border border-transparent hover:border-amber-500 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Image
                      src={getPieceImage(boardStyle, myColor || 'white', t as any)}
                      alt={t}
                      width={80}
                      height={80}
                      unoptimized
                      className={myColor === 'black' ? 'dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.7)]' : ''}
                    />
                  </div>
                  <span className="text-sm font-black uppercase text-stone-400 group-hover:text-amber-500">{t}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {drawOffer === 'pending' && (
        <div className="absolute inset-0 z-110 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-4xl shadow-2xl border border-blue-100 dark:border-stone-800 text-center max-w-sm mx-4 transform animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><Hand size={32} /></div>
            <h2 className="text-2xl font-black mb-2 dark:text-white">Draw Offered</h2>
            <p className="text-stone-500 text-sm mb-8">Your opponent has offered a draw. Accept?</p>
            <div className="flex gap-3">
              <button onClick={handleDeclineDraw} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-stone-600 rounded-2xl font-bold">Decline</button>
              <button onClick={handleAcceptDraw} className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20">Accept</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />}
      {gameResult && <GameEndEffect result={gameResult!} onClose={() => setGameResult(null)} />}
    </div>
  );
}