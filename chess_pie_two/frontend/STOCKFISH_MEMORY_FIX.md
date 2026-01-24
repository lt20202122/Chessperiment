# Stockfish Memory Leak Fix

## Problem

Your application was running out of memory (exceeding 512MB) when using Stockfish, even though you only used it once.

## Root Causes Identified

### 1. **Excessive Hash Table Size (Primary Issue)**

- Stockfish's default hash table size is **128MB or more**
- This is used for position caching during search
- With other app memory usage, this easily exceeded the 512MB limit

### 2. **No Move Time Constraints**

- Stockfish was allowed to search indefinitely at higher depths
- This could accumulate memory during long searches
- No timeout meant it could use more and more memory

### 3. **Potential Worker Cleanup Issues**

- Worker termination wasn't guaranteed to happen properly
- Messages could still be processed after cleanup started

## Fixes Applied

### 1. **Limited Hash Table to 16MB**

```typescript
worker.postMessage("setoption name Hash value 16");
```

This reduces Stockfish's memory usage by **85-90%** while still maintaining reasonable performance.

### 2. **Limited Thread Count to 1**

```typescript
worker.postMessage("setoption name Threads value 1");
```

Single-threaded mode uses less memory and is sufficient for a web app.

### 3. **Added Move Time Limit (5 seconds)**

```typescript
workerRef.current.postMessage(`go depth ${depth} movetime 5000`);
```

This prevents Stockfish from searching too long and accumulating memory.

### 4. **Reduced Maximum Search Depth**

```typescript
const depth = Math.max(1, Math.min(15, Math.floor(difficulty / 150)));
```

Changed from max depth 20 to max depth 15 to reduce memory usage.

### 5. **Improved Worker Cleanup**

```typescript
let isCleanedUp = false;
// ...
worker.onmessage = (event: StockfishMessage) => {
  if (isCleanedUp) return; // Ignore messages after cleanup
  // ...
};
// ...
return () => {
  isCleanedUp = true;
  if (worker) {
    try {
      worker.postMessage("quit");
      worker.terminate();
    } catch (e) {
      console.error("Error terminating worker:", e);
    }
  }
  workerRef.current = null;
  setIsReady(false);
};
```

## Expected Results

- **Memory Usage**: Should now use ~30-50MB for Stockfish instead of 128MB+
- **Total App Memory**: Should stay well under 512MB
- **Performance**: Slightly faster response times due to move time limit
- **Stability**: No more out-of-memory crashes

## Technical Details

### Before:

- Hash: ~128MB (default)
- Threads: CPU count (could be 4-8+)
- Max Depth: 20
- Move Time: Unlimited
- **Total Estimated Memory: 150-300MB+ just for Stockfish**

### After:

- Hash: 16MB (configured)
- Threads: 1 (configured)
- Max Depth: 15
- Move Time: 5 seconds max
- **Total Estimated Memory: 20-40MB for Stockfish**

## Testing Recommendations

1. Test computer games at various difficulty levels
2. Monitor memory usage in browser DevTools (Performance tab)
3. Play multiple games in succession to ensure no memory accumulation
4. Test on mobile devices with limited memory
