# Logic System Fixes - Implementation Plan

## Overview

This document outlines concrete solutions for the 15 logic system problems identified in `LOGIC_PROBLEMS.md`. Each solution includes the specific code changes needed and the rationale behind them.

---

## PHASE 1: CRITICAL FIXES (Blocking MVP)

### Issue #1: Capture Prevention Creates Overlapping Pieces ⚠️ **HIGHEST PRIORITY**

**Current Problem:**

```typescript
// board.ts lines 122-130
if (isCapture && !prevented) {
  const captureContext = {
    from,
    to,
    capturedPiece: destinationPiece,
    prevented: false,
  };
  pieceToMove.executeLogic("on-capture", captureContext, this);

  if (captureContext.prevented) {
    // Piece A is already at 'to', Piece B should stay at 'to'
    // Result: Both pieces at same square!
    displacementSquare = this.findNearestEmptySquare(to);
  }
}
```

**Root Cause Analysis:**

1. Line 107: `this.stateManager.setPiece(to, pieceToMove)` - Attacker placed at destination
2. Line 108: `this.stateManager.setPiece(from, null)` - Origin cleared
3. Line 124: `on-capture` trigger fires
4. Line 126: User prevents capture with `prevent` effect
5. **Problem**: Attacker is already at `to`, but defender should stay there too

**Proposed Solution: Bounce Back Attacker**

When capture is prevented, the attacking piece should "bounce back" to its origin square:

```typescript
// board.ts - Modified movePiece function
movePiece(from: Square, to: Square, promotion?: string): void {
    const piece = this.getPiece(from);
    if (piece) {
        const destinationPiece = this.getPiece(to);
        const isCapture = destinationPiece !== null && destinationPiece.color !== piece.color;

        let pieceToMove = piece;
        if (promotion) {
            const newPiece = Piece.create(`${piece.id}_promo`, promotion as any, piece.color, to);
            if (newPiece) pieceToMove = newPiece;
        }

        // DON'T move the piece yet - just prepare it
        const oldPos = piece.position;

        let movePrevented = false;
        let capturePrevented = false;

        // Execute logic hooks BEFORE actually moving
        if (pieceToMove instanceof CustomPiece) {
            // on-move trigger (check if move itself is prevented)
            const moveContext = { from, to, capturedPiece: isCapture ? destinationPiece : null, prevented: false };
            pieceToMove.executeLogic('on-move', moveContext, this);
            if (moveContext.prevented) {
                movePrevented = true;
            }

            // on-capture trigger (only if move not prevented and it's a capture)
            if (!movePrevented && isCapture) {
                const captureContext = { from, to, capturedPiece: destinationPiece, prevented: false };
                pieceToMove.executeLogic('on-capture', captureContext, this);
                if (captureContext.prevented) {
                    capturePrevented = true;
                }
            }
        }

        // NOW decide what to do based on prevention flags
        if (movePrevented) {
            // Move was prevented - piece stays at origin, nothing happens
            return;
        }

        if (capturePrevented) {
            // Capture was prevented - move is cancelled, piece stays at origin
            // Defender stays at destination
            return;
        }

        // No prevention - execute the move normally
        this.stateManager.setPiece(to, pieceToMove);
        this.stateManager.setPiece(from, null);
        pieceToMove.position = to;
        pieceToMove.hasMoved = true;
        this.stateManager.addMoveToHistory(from, to, pieceToMove.id);

        // Turn Lifecycle: Update all custom pieces
        const allSquares = this.getSquares();
        for (const s in allSquares) {
            const p = allSquares[s as Square];
            if (p instanceof CustomPiece) {
                p.updateTurnState(this);
            }
        }

        // Threat Detection
        this.checkThreats();
    }
}
```

**Why This Solution:**

- ✅ No overlapping pieces - attacker stays at origin if capture prevented
- ✅ Intuitive - "you can't capture this piece" means "you can't move there"
- ✅ Simple - no displacement logic needed
- ✅ Consistent - preventing capture = preventing the move to that square

**Alternative Considered:**

- Swap pieces: Too confusing, not intuitive
- Displace defender: Current solution, arbitrary and confusing
- Allow overlap: Would break the game

---

### Issue #2: Move vs Capture Prevention Semantics

**Current Confusion:**

- `on-move` + `prevent` → Entire move cancelled ✅
- `on-capture` + `prevent` → Capture prevented, but move happens with displacement ❌

**Solution: Make Them Consistent**

With the fix from Issue #1, both will now work the same way:

- `on-move` + `prevent` → Move cancelled, piece stays at origin
- `on-capture` + `prevent` → Move cancelled, piece stays at origin

**Additional Clarity Needed:**

Add a new effect: `prevent-move` (explicit) vs `prevent-capture` (specific)

```typescript
// piece.ts - Add new effect types
case 'prevent-move':
    context.movePrevented = true;
    break;
case 'prevent-capture':
    context.capturePrevented = true;
    break;
```

Update `prevent` to be context-aware:

```typescript
case 'prevent':
    // Generic prevent - prevents the current trigger's action
    if (context.type === 'move') context.movePrevented = true;
    else if (context.type === 'capture') context.capturePrevented = true;
    break;
```

**Documentation Update:**

- Add tooltips in visual editor explaining what each prevent does
- Show warning when user adds `prevent` to `on-capture` trigger

---

### Issue #14: Visual Feedback (COMPLETED ✅)

**Solution Implemented:**

- Created `PieceStateIndicators.tsx` component
- Shows cooldown, charge, mode, logic sparkle, threat warning
- Integrated into `PieceRenderer.tsx`
- Updated `Board.tsx` to pass piece state data

**Remaining Work:**

- Add trigger fire animations (particle bursts)
- Add effect execution flashes
- Test with pieces that have all states

---

## PHASE 2: CORE MECHANICS

### Issue #5: Variable Modification Timing & Infinite Loops

**Current Problem:**

```typescript
// piece.ts line 133
case 'modify-var':
    this.variables[vals.varName] = next;
    // This immediately triggers on-var, which could modify the var again!
    this.executeLogic('on-var', { varName: vals.varName, value: next }, board);
    break;
```

**Solution: Deferred Trigger Execution**

```typescript
// piece.ts - Add execution queue
private pendingTriggers: Array<{ type: string, context: any }> = [];
private isExecutingLogic: boolean = false;

executeLogic(triggerType: string, context: any, board: BoardClass) {
    // Prevent recursive execution
    if (this.isExecutingLogic) {
        this.pendingTriggers.push({ type: triggerType, context });
        return;
    }

    this.isExecutingLogic = true;
    this._executeLogicInternal(triggerType, context, board);

    // Process pending triggers (max 10 to prevent infinite loops)
    let iterations = 0;
    while (this.pendingTriggers.length > 0 && iterations < 10) {
        const pending = this.pendingTriggers.shift()!;
        this._executeLogicInternal(pending.type, pending.context, board);
        iterations++;
    }

    if (this.pendingTriggers.length > 0) {
        console.warn(`[Logic] Infinite loop detected for piece ${this.id}, stopping execution`);
        this.pendingTriggers = [];
    }

    this.isExecutingLogic = false;
}

private _executeLogicInternal(triggerType: string, context: any, board: BoardClass) {
    // Current executeLogic implementation goes here
}
```

**Additional Safety:**

- Add max execution depth counter
- Log warning when approaching limit
- Show visual indicator in editor when piece has potential infinite loop

---

### Issue #6: Cooldown System Improvements

**Current Issues:**

- Cooldown prevents movement but not logic execution
- No visual feedback (FIXED in Phase 1)
- No triggers for cooldown start/end

**Solution: Complete Cooldown System**

```typescript
// piece.ts - Enhanced cooldown handling
updateTurnState(board: BoardClass) {
    const oldCooldown = this.variables['cooldown'] || 0;

    if (this.variables['cooldown'] && this.variables['cooldown'] > 0) {
        this.variables['cooldown']--;

        // Trigger on-cooldown-tick
        this.executeLogic('on-cooldown-tick', { remaining: this.variables['cooldown'] }, board);

        // Trigger on-cooldown-end when it reaches 0
        if (this.variables['cooldown'] === 0) {
            this.executeLogic('on-cooldown-end', {}, board);
        }
    }

    // Similar for charge
    if (this.variables['charge'] && this.variables['charge'] > 0) {
        this.variables['charge']--;

        if (this.variables['charge'] === 0) {
            this.executeLogic('on-charge-complete', {}, board);
        }
    }
}
```

**New Triggers to Add:**

- `on-cooldown-start` - When cooldown is set
- `on-cooldown-tick` - Each turn while on cooldown
- `on-cooldown-end` - When cooldown reaches 0
- `on-charge-complete` - When charge reaches 0

**Visual Editor Updates:**

- Add these triggers to the palette
- Show cooldown/charge in piece preview

---

### Issue #7: Complete Charge Mechanic

**Current Problem:**

- Charge decrements but nothing happens when it reaches 0
- No way to consume charge for special moves

**Solution: Charge-Based Move Conditions**

```typescript
// types.ts - Add charge condition to MoveCondition
interface MoveCondition {
  id: string;
  variable:
    | "diffX"
    | "diffY"
    | "absDiffX"
    | "absDiffY"
    | "charge"
    | "cooldown"
    | "mode";
  operator: "===" | ">" | "<" | ">=" | "<=";
  value: number;
  logic?: "AND" | "OR";
}
```

```typescript
// piece.ts - Check charge in isValidMove
isValidMove(from: Square, to: Square, board: BoardClass): boolean {
    // ... existing checks ...

    // Check move rules (including charge requirements)
    for (const rule of this.rules) {
        let allConditionsMet = true;

        for (const cond of rule.conditions) {
            // ... existing condition checks ...

            // NEW: Check variable-based conditions
            if (cond.variable === 'charge' || cond.variable === 'cooldown' || cond.variable === 'mode') {
                const value = this.variables[cond.variable] || 0;
                const condMet = this.evaluateCondition(value, cond.operator, cond.value);
                if (!condMet) {
                    allConditionsMet = false;
                    break;
                }
            }
        }

        if (allConditionsMet && rule.result === 'allow') return true;
        if (allConditionsMet && rule.result === 'disallow') return false;
    }

    return false;
}
```

**New Effect: Consume Charge**

```typescript
case 'consume-charge':
    if (vals.amount) {
        const current = this.variables['charge'] || 0;
        this.variables['charge'] = Math.max(0, current - Number(vals.amount));
    }
    break;
```

---

### Issue #8: Mode System Implementation

**Current Problem:**

- Mode is set but never used
- No conditional logic based on mode

**Solution: Mode-Based Move Rules**

Same as charge - add `mode` to variable conditions (already included in Issue #7 solution)

**Additional: Mode-Specific Effects**

```typescript
// New effect: Execute if mode matches
case 'if-mode':
    const requiredMode = vals.mode === 'On' ? 1 : 0;
    if (this.variables['mode'] === requiredMode && block.childId) {
        this.runBlock(block.childId, context, board);
    }
    break;
```

**Visual Editor:**

- Add mode condition to move rules
- Add `if-mode` effect block
- Show mode state in piece preview

---

## PHASE 3: ADVANCED FEATURES

### Issue #9: Threat Detection Timing

**Current Problem:**

- Threats checked AFTER move is finalized
- No way to prevent move based on being threatened

**Solution: Pre-Move Threat Check**

```typescript
// board.ts - Add threat check before move
movePiece(from: Square, to: Square, promotion?: string): void {
    const piece = this.getPiece(from);
    if (piece) {
        // Check if destination square is under threat
        if (piece instanceof CustomPiece) {
            const isUnderThreat = this.isSquareAttacked(to, piece.color === 'white' ? 'black' : 'white');
            if (isUnderThreat) {
                const threatContext = { square: to, prevented: false };
                piece.executeLogic('on-enter-threatened-square', threatContext, this);
                if (threatContext.prevented) {
                    return; // Move prevented due to threat
                }
            }
        }

        // ... rest of move logic ...
    }
}
```

**New Triggers:**

- `on-enter-threatened-square` - Before moving to a threatened square
- `on-leave-safe-square` - When leaving a safe square

---

### Issue #10: Environment-Based Triggers

**Current Problem:**

- `on-environment` only fires during turn updates
- No square-specific triggers

**Solution: Square Event Triggers**

```typescript
// board.ts - Fire environment triggers during move
movePiece(from: Square, to: Square, promotion?: string): void {
    const piece = this.getPiece(from);
    if (piece && piece instanceof CustomPiece) {
        // on-leave-square
        const leaveContext = { square: from };
        piece.executeLogic('on-leave-square', leaveContext, this);

        // ... move piece ...

        // on-enter-square
        const enterContext = { square: to };
        piece.executeLogic('on-enter-square', enterContext, this);

        // Check square color
        const [col, row] = toCoords(to);
        const isWhiteSquare = (col + row) % 2 === 0;
        const squareContext = { isWhiteSquare, isBlackSquare: !isWhiteSquare };
        piece.executeLogic('on-environment', squareContext, this);
    }
}
```

**New Triggers:**

- `on-enter-square`
- `on-leave-square`
- `on-adjacent-piece` (checked each turn)

---

### Issue #11: Multi-Piece Interactions

**Current Problem:**

- Logic only affects the piece that has it
- No "aura" effects

**Solution: Target Selection System**

```typescript
// New effect: Affect Other Pieces
case 'affect-adjacent':
    const [col, row] = toCoords(this.position);
    const adjacentSquares = [
        [col-1, row], [col+1, row], [col, row-1], [col, row+1],
        [col-1, row-1], [col-1, row+1], [col+1, row-1], [col+1, row+1]
    ];

    for (const [c, r] of adjacentSquares) {
        const sq = toSquare([c, r]);
        const targetPiece = board.getPiece(sq);
        if (targetPiece && targetPiece instanceof CustomPiece) {
            // Apply effect to target (e.g., set cooldown, modify var, etc.)
            if (vals.effect === 'cooldown') {
                targetPiece.variables['cooldown'] = Number(vals.value);
            }
        }
    }
    break;
```

**New Effects:**

- `affect-adjacent`
- `affect-all-allies`
- `affect-all-enemies`
- `summon` (create new piece)

---

### Issue #12: Conditional Chaining (If-Else Logic)

**Current Problem:**

- All effects in a chain execute
- No way to do "if this, else that"

**Solution: Stop Execution Effect**

```typescript
case 'stop-execution':
    context.stopExecution = true;
    break;
```

```typescript
// piece.ts - Check for stop in runBlock
private runBlock(blockId: string, context: any, board: BoardClass) {
    if (context.stopExecution) return; // Don't execute further blocks

    const block = this.logic.find((b: any) => b.instanceId === blockId);
    if (!block) return;

    // ... execute block ...

    if (block.childId && !context.stopExecution) {
        this.runBlock(block.childId, context, board);
    }
}
```

**Visual Editor:**

- Add `stop-execution` effect
- Add visual branching in logic editor
- Show warning when multiple conflicting effects exist

---

## PHASE 4: POLISH

### Issue #13: Undo/Redo for Logic Effects

**Solution: State Snapshots**

```typescript
// board.ts - Save full state before each move
interface BoardSnapshot {
    squares: Record<Square, PieceState>;
    turn: 'white' | 'black';
    pieceVariables: Record<string, Record<string, number>>; // pieceId -> variables
}

private snapshots: BoardSnapshot[] = [];

movePiece(from: Square, to: Square, promotion?: string): void {
    // Save snapshot before move
    this.saveSnapshot();

    // ... execute move ...
}

private saveSnapshot() {
    const snapshot: BoardSnapshot = {
        squares: { ...this.getSquares() },
        turn: this.getTurn(),
        pieceVariables: {}
    };

    for (const [sq, piece] of Object.entries(this.getSquares())) {
        if (piece && piece instanceof CustomPiece) {
            snapshot.pieceVariables[piece.id] = { ...piece.variables };
        }
    }

    this.snapshots.push(snapshot);
}

undo() {
    if (this.snapshots.length > 0) {
        const snapshot = this.snapshots.pop()!;
        // Restore state from snapshot
        // ... implementation ...
    }
}
```

---

### Issue #15: Improved Displacement Logic

**Solution: Remove Displacement Entirely**

With the fix from Issue #1, displacement is no longer needed. If capture is prevented, the move is cancelled.

**Cleanup:**

- Remove `findNearestEmptySquare` function
- Remove displacement logic from `movePiece`
- Simplify code significantly

---

## Implementation Priority

### Week 1: Critical Fixes

1. ✅ Visual Feedback System (DONE)
2. Fix capture prevention overlap (Issue #1)
3. Clarify move vs capture semantics (Issue #2)
4. Remove displacement logic (Issue #15)

### Week 2: Core Mechanics

5. Variable timing & loop prevention (Issue #5)
6. Complete cooldown system (Issue #6)
7. Complete charge mechanic (Issue #7)
8. Implement mode system (Issue #8)

### Week 3: Advanced Features

9. Threat detection timing (Issue #9)
10. Environment triggers (Issue #10)
11. Multi-piece interactions (Issue #11)
12. Conditional chaining (Issue #12)

### Week 4: Polish

13. Undo/redo for logic (Issue #13)
14. Testing & documentation
15. User feedback & iteration

---

## Testing Strategy

### For Each Fix:

1. Create test piece with the specific logic
2. Test in `/editor/board/play` mode
3. Verify visual feedback works
4. Check for edge cases
5. Document behavior in tooltips

### Example Test Pieces:

- **Capture Prevention Test**: Piece that prevents capture by pawns
- **Cooldown Test**: Piece with 3-turn cooldown after moving
- **Charge Test**: Piece that needs 5 turns to charge special move
- **Mode Test**: Piece that toggles between aggressive/defensive modes
- **Infinite Loop Test**: Piece that would create infinite loop (should be caught)

---

## Success Criteria

✅ **Phase 1 Complete When:**

- No overlapping pieces possible
- Visual indicators show for all piece states
- Users understand what "prevent" does

✅ **Phase 2 Complete When:**

- Variables work predictably without infinite loops
- Cooldown/charge/mode are fully functional
- Move rules can check variable values

✅ **Phase 3 Complete When:**

- Pieces can affect other pieces
- Conditional logic works (if-else)
- Environment triggers fire correctly

✅ **Phase 4 Complete When:**

- Undo/redo preserves all logic state
- All edge cases handled
- Documentation complete
