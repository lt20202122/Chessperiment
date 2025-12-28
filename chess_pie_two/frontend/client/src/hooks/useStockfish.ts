import { useEffect, useRef, useState, useCallback } from 'react';
import { Chess } from 'chess.js';

type StockfishMessage = {
  data: string;
};

export function useStockfish(game: Chess, difficulty: number = 1300, onBestMove: (move: string) => void) {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    // Initialize worker
    let worker: Worker;
    try {
        // Use the lite single-threaded version for better web compatibility
      worker = new Worker('/stockfish/src/stockfish-17.1-lite-single-03e3232.js');
      workerRef.current = worker;

      worker.onmessage = (event: StockfishMessage) => {
        const line = event.data;
        // console.log('SF:', line);

        if (line === 'uciok') {
          setIsReady(true);
        } else if (line.startsWith('bestmove')) {
          setIsThinking(false);
          const move = line.split(' ')[1];
          if (move && move !== '(none)') {
            onBestMove(move);
          }
        }
      };

      worker.postMessage('uci');
      worker.postMessage('isready');
    } catch (error) {
      console.error('Stockfish init error:', error);
    }

    return () => {
      worker?.terminate();
    };
  }, [onBestMove]);

  // Update difficulty
  useEffect(() => {
    if (!workerRef.current || !isReady) return;
    
    // Simple difficulty mapping
    // Skill Level: 0-20
    const skillLevel = Math.max(0, Math.min(20, Math.floor((difficulty - 400) / 100)));
    
    workerRef.current.postMessage(`setoption name Skill Level value ${skillLevel}`);
    // Limit depth based on ELO to simulate mistakes
    const depth = Math.max(1, Math.min(20, Math.floor(difficulty / 150))); 
    
  }, [difficulty, isReady]);

  const requestMove = useCallback(() => {
    if (!workerRef.current || !isReady) return;
    setIsThinking(true);
    workerRef.current.postMessage(`position fen ${game.fen()}`);
    // Calculate depth based on difficulty
    const depth = Math.max(1, Math.min(20, Math.floor(difficulty / 150))); 
    workerRef.current.postMessage(`go depth ${depth}`);
  }, [game, difficulty, isReady]);

  return { isReady, isThinking, requestMove };
}
