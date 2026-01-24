// stockfish-pool.js
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

// Load loadEngine the same way new_server.js does
const loadEnginePath = path.join(__dirname, "loadEngine.js");
const fs = require("fs");
const loadEngineCode = fs.readFileSync(loadEnginePath, "utf8");
const vm = require("vm");

const nodeRequire = (moduleName) => {
  if (moduleName === "child_process") return require("child_process");
  if (moduleName === "path") return require("path");
  if (moduleName === "fs") return require("fs");
  try {
    return require(moduleName);
  } catch (e) {
    throw new Error(`Cannot find module '${moduleName}'`);
  }
};

const loadEngineContext = {
  module: { exports: {} },
  exports: {},
  require: nodeRequire,
  __dirname: __dirname,
  __filename: loadEnginePath,
  console: console,
  process: process,
  Buffer: Buffer,
  global: global,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
};

vm.createContext(loadEngineContext);
vm.runInContext(loadEngineCode, loadEngineContext);
const loadEngine =
  loadEngineContext.module.exports ||
  loadEngineContext.exports ||
  loadEngineContext.loadEngine;

if (typeof loadEngine !== "function") {
  throw new Error(
    `loadEngine is not a function. Got type: ${typeof loadEngine}`,
  );
}

class StockfishPool {
  constructor() {
    this.engine = null;
    this.isInitialized = false;
    this.isProcessing = false;
    this.queue = [];
    this.initializeEngine();
  }

  initializeEngine() {
    try {
      const stockfishPath = path.join(
        __dirname,
        "node_modules",
        "stockfish",
        "src",
        "stockfish-17.1-lite-single-03e3232.js", // Use LITE version
      );
      this.engine = loadEngine(stockfishPath);

      if (!this.engine) {
        console.error("[Stockfish Pool] Failed to load engine");
        return;
      }

      // Configure with memory limits
      this.engine.send("uci", () => {
        if (!this.engine) return;

        // CRITICAL: Set hash table to 32MB (good balance for server)
        this.engine.send("setoption name Hash value 32", () => {
          if (!this.engine) return;

          // Limit threads to 2 for better multi-game handling
          this.engine.send("setoption name Threads value 2", () => {
            this.isInitialized = true;
            console.log(
              "[Stockfish Pool] Engine initialized with memory limits (32MB hash, 2 threads)",
            );
            this.processQueue();
          });
        });
      });
    } catch (error) {
      console.error("[Stockfish Pool] Failed to initialize engine:", error);
    }
  }

  processQueue() {
    if (this.queue.length > 0 && !this.isProcessing) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  async getBestMove(fen, difficulty) {
    return new Promise((resolve) => {
      const executeMove = () => {
        if (!this.engine || !this.isInitialized) {
          console.error("[Stockfish Pool] Engine not ready");
          resolve(null);
          this.isProcessing = false;
          this.processQueue();
          return;
        }

        this.isProcessing = true;
        let hasResponded = false;

        const timeout = setTimeout(() => {
          if (!hasResponded) {
            console.error("[Stockfish Pool] Move timeout");
            hasResponded = true;
            this.isProcessing = false;
            resolve(null);
            this.processQueue();
          }
        }, 10000); // 10 second timeout

        const skillLevel = Math.max(
          0,
          Math.min(20, Math.floor((difficulty - 400) / 100)),
        );
        const depth = Math.max(1, Math.min(15, Math.floor(difficulty / 150)));

        this.engine.send(
          `setoption name Skill Level value ${skillLevel}`,
          () => {
            if (!this.engine) return;

            this.engine.send("ucinewgame", () => {
              if (!this.engine) return;

              this.engine.send(`position fen ${fen}`, () => {
                if (!this.engine) return;

                // Add movetime limit for safety (5 seconds)
                this.engine.send(
                  `go depth ${depth} movetime 5000`,
                  (result) => {
                    if (hasResponded) return;

                    clearTimeout(timeout);
                    hasResponded = true;

                    const match = result.match(/bestmove\s+(\S+)/);
                    const bestMove = match ? match[1] : null;

                    this.isProcessing = false;
                    resolve(
                      bestMove && bestMove !== "(none)" ? bestMove : null,
                    );
                    this.processQueue();
                  },
                );
              });
            });
          },
        );
      };

      if (!this.isProcessing && this.isInitialized) {
        executeMove();
      } else {
        console.log(
          `[Stockfish Pool] Request queued (queue size: ${this.queue.length + 1})`,
        );
        this.queue.push(executeMove);
      }
    });
  }

  shutdown() {
    try {
      this.engine?.quit();
    } catch (error) {
      console.error("[Stockfish Pool] Error shutting down:", error);
    }
  }
}

// Singleton instance
export const stockfishPool = new StockfishPool();

// Cleanup on process exit
process.on("SIGINT", () => {
  stockfishPool.shutdown();
  process.exit();
});
