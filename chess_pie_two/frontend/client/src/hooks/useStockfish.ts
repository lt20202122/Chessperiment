import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';

type StockfishMessage = {
  data: string;
};

export function useStockfish(currentFen: string, difficulty: number = 1300, onBestMove: (move: string) => void, useServer: boolean = true) {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const onBestMoveRef = useRef(onBestMove);
  const socket = useSocket();

  // Update ref when onBestMove changes without restarting worker
  useEffect(() => {
    onBestMoveRef.current = onBestMove;
  }, [onBestMove]);

  // Server-side Logic
  useEffect(() => {
    if (!useServer || !socket) return;

    const onComputerMove = (data: { bestMove: string }) => {
      setIsThinking(false);
      if (data.bestMove && data.bestMove !== '(none)') {
        onBestMoveRef.current(data.bestMove);
      }
    };

    socket.on("computer_move_result", onComputerMove);
    setIsReady(true); // Server is assumed ready if connected

    return () => {
      socket.off("computer_move_result", onComputerMove);
    };
  }, [socket, useServer]);


  // Client-side Logic (Worker)
  useEffect(() => {
    if (useServer) return; // Skip if using server

    let worker: Worker;
    try {
      worker = new Worker('/stockfish/src/stockfish-17.1-lite-single-03e3232.js');
      workerRef.current = worker;

      worker.onmessage = (event: StockfishMessage) => {
        const line = event.data;
        // console.log('Stockfish:', line);

        if (line === 'uciok' || line === 'readyok') {
          setIsReady(true);
        } else if (line.startsWith('bestmove')) {
          setIsThinking(false);
          const move = line.split(' ')[1];
          if (move && move !== '(none)') {
            onBestMoveRef.current(move);
          }
        }
      };

      worker.postMessage('uci');
      worker.postMessage('isready');
      worker.postMessage('ucinewgame');
    } catch (error) {
      console.error('Stockfish init error:', error);
    }

    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, [useServer]); // Re-run if useServer changes

  // Update difficulty (Local only - Server handles it per request)
  useEffect(() => {
    if (useServer || !workerRef.current || !isReady) return;
    const skillLevel = Math.max(0, Math.min(20, Math.floor((difficulty - 400) / 100)));
    workerRef.current.postMessage(`setoption name Skill Level value ${skillLevel}`);
  }, [difficulty, isReady, useServer]);

  const requestMove = useCallback((fenOverride?: string) => {
    const targetFen = fenOverride || currentFen;
    setIsThinking(true);

    if (useServer) {
        if (socket) {
            socket.emit("request_computer_move", { fen: targetFen, difficulty });
        } else {
            console.warn("Socket not available for server stockfish");
            setIsThinking(false);
        }
        return;
    }

    if (!workerRef.current || !isReady) {
        console.warn('Stockfish requested before ready or worker missing');
        setIsThinking(false);
        return;
    }
    workerRef.current.postMessage(`position fen ${targetFen}`);
    const depth = Math.max(1, Math.min(20, Math.floor(difficulty / 150))); 
    workerRef.current.postMessage(`go depth ${depth}`);
  }, [currentFen, difficulty, isReady, useServer, socket]);

  return { isReady, isThinking, requestMove };
}
