# Advanced Logic System - Design Problems & Edge Cases

## Critical Issues

### 1. **Capture Prevention Creates Overlapping Pieces** ⚠️ HIGH PRIORITY

**Current Behavior:**

- When `on-capture` trigger fires with `prevent` effect
- The capture is prevented, but the moving piece still occupies the destination square
- Result: Two pieces occupy the same square (visual and logical conflict)

**Root Cause:**

- In `board.ts` lines 122-130: The displacement logic only applies if `captureContext.prevented` is true
- The moving piece has already been placed at `to` (line 107)
- If capture is prevented, the captured piece should stay, but the moving piece is already there

**Current Workaround:**

- System finds nearest empty square and displaces the captured piece there
- This is confusing and not intuitive

**Proposed Solutions:**

1. **Option A - Revert Move:** If capture is prevented, revert the entire move (piece stays at origin)
2. **Option B - Swap:** Swap the two pieces' positions
3. **Option C - Bounce Back:** Move the attacking piece to its origin, keep captured piece in place
4. **Option D - User Choice:** Add a new effect block "Displace Attacker" vs "Displace Defender"

---

### 2. **Move Prevention vs Capture Prevention Ambiguity**

**Problem:**

- `on-move` trigger with `prevent` → Entire move is cancelled
- `on-capture` trigger with `prevent` → Only capture is prevented, but move still happens (with displacement)
- This inconsistency is confusing

**Example Scenario:**

```
Piece A moves to capture Piece B
- on-move fires → if prevented, move cancelled entirely
- on-capture fires → if prevented, Piece B is displaced, Piece A still moves
```

**Questions:**

- Should preventing a capture also prevent the move?
- Should there be separate "prevent move" and "prevent capture" effects?

---

### 3. **Kill vs Capture Semantic Confusion**

**Current Implementation:**

- **Capture** = Trigger when a piece moves to an occupied square (can be prevented)
- **Kill** = Effect that removes a piece from the board (immediate, no prevention)

**Problems:**

- Users might expect `kill` to be preventable
- No way to "kill without capturing" (e.g., piece dies from poison after X turns)
- No way to "capture without killing" (e.g., capture piece but it escapes)

**Missing Features:**

- `on-death` trigger (when a piece is about to be removed, regardless of how)
- `resurrect` effect (bring a piece back)
- `imprison` effect (capture but keep piece alive in a "prison" zone)

---

### 4. **Transformation During Capture**

**Scenario:**

```
Piece A captures Piece B
on-capture → transformation (Piece A becomes Piece C)
```

**Problems:**

- Transformation happens AFTER the piece has moved
- The transformed piece inherits `hasMoved` status
- What if the transformation should change the piece's position?
- What if transformation should be prevented by certain conditions?

**Edge Cases:**

- Transform into a piece type that cannot legally be on that square
- Transform into a piece that has different move rules (retroactive legality?)
- Transform while a capture is being prevented

---

### 5. **Variable Modification Timing Issues**

**Current Flow:**

```typescript
on-move → modify-var → on-var check
on-capture → modify-var → on-var check
updateTurnState → on-var check
```

**Problems:**

- Variables can be modified multiple times in a single move
- `on-var` triggers can fire recursively (line 133 in piece.ts)
- No way to prevent infinite loops if `on-var` → `modify-var` → `on-var`
- Cooldown/Charge decrements happen AFTER the move, not before

**Example Infinite Loop:**

```
on-var (cooldown == 0) → modify-var (cooldown = 5) → triggers on-var again
```

---

### 6. **Cooldown Prevents Movement But Not Logic Execution**

**Current Behavior (lines 179-181 in piece.ts):**

```typescript
if (this.variables["cooldown"] && this.variables["cooldown"] > 0) {
  return false; // Move is invalid
}
```

**Problems:**

- Piece cannot move, but can still be captured
- Piece cannot move, but its `on-threat` triggers still fire
- Piece cannot move, but `on-environment` still executes
- No visual indicator that a piece is on cooldown

**Missing:**

- `on-cooldown-end` trigger
- `on-cooldown-start` trigger
- Visual feedback for cooldown state

---

### 7. **Charge Mechanic Incomplete**

**Current Implementation:**

- `charge` effect sets a variable
- Variable decrements each turn
- **BUT**: No trigger for when charge reaches 0
- **BUT**: No effect that requires charge to be consumed

**Missing:**

- `on-charged` trigger (when charge reaches target value)
- `consume-charge` effect (use charge to enable special move)
- `requires-charge` condition for move rules

---

### 8. **Mode Toggle Has No Effect**

**Current Implementation (lines 146-150):**

```typescript
case 'mode':
    if (vals.mode) {
        this.variables['mode'] = vals.mode === 'On' ? 1 : 0;
    }
    break;
```

**Problems:**

- Mode is set but never checked
- No conditional logic based on mode
- No way to say "if mode == 1, allow this move"

**Missing:**

- Mode-based move rules
- `on-mode-change` trigger
- Visual indicator for mode state

---

### 9. **Threat Detection Happens Too Late**

**Current Flow (board.ts lines 158-159):**

```typescript
// Threat Detection
this.checkThreats();
```

**Problems:**

- Threats are checked AFTER the move is finalized
- Piece might have already been transformed/killed before `on-threat` fires
- No way to prevent a move based on being threatened
- No "pre-move threat check"

**Example:**

```
Piece A moves to square X
Piece B can now attack square X
on-threat fires for Piece A
But Piece A is already committed to the move
```

---

### 10. **Environment Checks Are Passive**

**Current Implementation:**

- `on-environment` only fires during `updateTurnState`
- No way to trigger based on entering a specific square
- No way to trigger based on leaving a square

**Missing Triggers:**

- `on-enter-square` (when piece moves to a square)
- `on-leave-square` (when piece moves from a square)
- `on-adjacent-piece` (when a specific piece type is adjacent)
- Square-specific conditions (e.g., "if on center square")

---

### 11. **No Multi-Piece Interactions**

**Current Limitation:**

- Logic only affects the piece that has the logic
- No way to affect other pieces
- No way to create "aura" effects

**Missing Effects:**

- `affect-adjacent` (apply effect to adjacent pieces)
- `affect-all-allies` (apply effect to all pieces of same color)
- `affect-all-enemies` (apply effect to all enemy pieces)
- `summon` (create a new piece on the board)

---

### 12. **No Conditional Chaining**

**Current Implementation:**

- Triggers execute their child effects unconditionally (if conditions met)
- No "if-else" logic
- No "switch-case" logic

**Example Limitation:**

```
on-capture by Pawn → transform to Queen
on-capture by Knight → transform to Rook
on-capture by ANY → kill self

Currently: All three would execute if conditions overlap
```

**Missing:**

- `else` blocks
- `stop-execution` effect (prevent further effects in chain)
- Priority/ordering system for conflicting effects

---

### 13. **No Undo/Redo for Logic Effects**

**Problem:**

- User can undo moves in the board editor play mode
- But logic effects (transformations, variable changes) are not tracked in history
- Undoing a move doesn't undo the transformation that happened

**Missing:**

- Effect history tracking
- Reversible effects
- State snapshots for undo/redo

---

### 14. **No Visual Feedback for Logic State**

**Current State:**

- Variables (cooldown, charge, mode) are invisible to the player
- No way to see that a piece has special logic
- No way to see what triggers/effects a piece has

**Missing:**

- Visual indicators (badges, glows, icons)
- Tooltip showing piece's logic
- Animation when triggers fire
- Particle effects for transformations

---

### 15. **Displacement Logic Is Arbitrary**

**Current Implementation (board.ts lines 68-91):**

```typescript
findNearestEmptySquare(target: Square): Square | null {
    // Spiral search for nearest empty active square
    ...
}
```

**Problems:**

- "Nearest" is based on Manhattan distance, not chess logic
- Displaced piece might end up in an illegal position for its type
- No user control over displacement direction
- Displacement might fail if no empty squares exist

**Edge Cases:**

- Board is nearly full → displacement fails
- Displaced piece ends up off the board
- Displaced piece ends up in a position it couldn't normally reach

---

## Recommended Priority Order

### Phase 1: Critical Fixes (Blocking MVP)

1. Fix capture prevention overlap issue (#1)
2. Clarify move vs capture prevention semantics (#2)
3. Add visual feedback for logic states (#14)

### Phase 2: Core Mechanics (Essential for gameplay)

4. Implement proper variable timing and loop prevention (#5)
5. Add cooldown visual feedback and triggers (#6)
6. Complete charge mechanic (#7)
7. Implement mode-based logic (#8)

### Phase 3: Advanced Features (Nice to have)

8. Add multi-piece interactions (#11)
9. Implement conditional chaining (#12)
10. Add environment-based triggers (#10)
11. Improve threat detection timing (#9)

### Phase 4: Polish (Post-MVP)

12. Undo/redo for logic effects (#13)
13. Improve displacement logic (#15)
14. Add kill vs capture distinction (#3)
15. Add transformation safeguards (#4)

---

## Suggested Immediate Actions

1. **Document Current Behavior**: Add tooltips explaining what "prevent" does in each context
2. **Add Warnings**: Show warning when user creates potentially problematic logic (e.g., infinite loops)
3. **Simplify First**: Remove or disable features that don't work properly (mode, charge)
4. **Test Cases**: Create example pieces that demonstrate each trigger/effect combination
5. **User Feedback**: Add console logs or visual indicators when logic executes

---

## Long-term Architecture Recommendations

1. **Effect System Redesign**: Separate "immediate effects" from "delayed effects"
2. **State Machine**: Implement proper state machine for piece states (normal, cooldown, charged, etc.)
3. **Event Queue**: Process all triggers/effects in a queue to prevent timing issues
4. **Validation Layer**: Check for impossible states before applying effects
5. **Rollback System**: Allow effects to be reversed for undo/redo
