import { useEffect, useRef, useState, useCallback } from 'react';
import { Chess } from 'chess.js';

type StockfishMessage = {
  data: string;
};

export function useStockfish(currentFen: string, difficulty: number = 1300, onBestMove: (move: string) => void) {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const onBestMoveRef = useRef(onBestMove);

  // Update ref when onBestMove changes without restarting worker
  useEffect(() => {
    onBestMoveRef.current = onBestMove;
  }, [onBestMove]);

  useEffect(() => {
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
    };
  }, []); // Only init once

  // Update difficulty
  useEffect(() => {
    if (!workerRef.current || !isReady) return;
    const skillLevel = Math.max(0, Math.min(20, Math.floor((difficulty - 400) / 100)));
    workerRef.current.postMessage(`setoption name Skill Level value ${skillLevel}`);
  }, [difficulty, isReady]);

  const requestMove = useCallback((fenOverride?: string) => {
    if (!workerRef.current || !isReady) {
        console.warn('Stockfish requested before ready or worker missing');
        return;
    }
    const targetFen = fenOverride || currentFen;
    setIsThinking(true);
    workerRef.current.postMessage(`position fen ${targetFen}`);
    const depth = Math.max(1, Math.min(20, Math.floor(difficulty / 150))); 
    workerRef.current.postMessage(`go depth ${depth}`);
  }, [currentFen, difficulty, isReady]);

  return { isReady, isThinking, requestMove };
}
