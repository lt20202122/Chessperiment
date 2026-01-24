# Quick Reference: Stockfish Memory Settings

## Memory Usage Breakdown

### What Uses Memory:

1. **Hash Table (Transposition Table)** ← 99% of the problem
2. Search tree (temporary)
3. Thread stacks

### What DOESN'T Use Significant Memory:

- ✅ Storing FEN positions (a few KB)
- ✅ Move history in SAN notation (a few KB)
- ✅ The Stockfish binary itself (~5MB)

## Configuration Commands

### Set Hash Table Size:

```
setoption name Hash value <MB>
```

### Set Thread Count:

```
setoption name Threads value <number>
```

### Set Skill Level (for difficulty):

```
setoption name Skill Level value <0-20>
```

## Recommended Settings by Environment

| Environment          | Hash     | Threads | Max Depth | Move Time | Total Memory |
| -------------------- | -------- | ------- | --------- | --------- | ------------ |
| **Browser (Client)** | 16MB     | 1       | 15        | 5s        | ~40MB        |
| **Server (Node.js)** | 32MB     | 2       | 15        | 5s        | ~80MB        |
| **Powerful Server**  | 64-128MB | 4       | 20        | 10s       | ~150-250MB   |
| **Very Low Memory**  | 8MB      | 1       | 10        | 3s        | ~25MB        |

## FEN vs SAN - Memory Clarification

You said: "Stockfish doesn't need memory for FEN because it gets the new FEN not SAN"

**Both are tiny!**

- FEN string: ~80-100 bytes
- SAN notation: ~5-10 bytes per move
- 100 moves of history: ~500 bytes to 1KB

**The REAL memory user:**

- Hash table: **16MB to 2GB**
- That's **16,000 to 2,000,000 times** larger than FEN/SAN!

## Example: Hash Table Impact

```javascript
// NO HASH LIMIT (default ~128MB)
worker.postMessage("uci");
worker.postMessage("go depth 15");
// Memory: ~150-200MB

// WITH 16MB LIMIT
worker.postMessage("uci");
worker.postMessage("setoption name Hash value 16");
worker.postMessage("go depth 15");
// Memory: ~30-40MB

// Same position, same calculation, 80% less memory!
```

## Files Changed in This Fix

### Client-Side:

- ✅ `client/src/hooks/useStockfish.ts` - Added memory limits

### Server-Side:

- ✅ `server/stockfish-pool.ts` - NEW: Efficient engine pool
- ✅ `server/new_server.ts` - Updated to use pool

### Documentation:

- ✅ `STOCKFISH_MEMORY_FIX.md` - Initial fix explanation
- ✅ `STOCKFISH_COMPLETE_SOLUTION.md` - Complete guide
- ✅ `STOCKFISH_QUICK_REFERENCE.md` - This file
