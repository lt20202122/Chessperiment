# Help Articles

These articles explain the core features of ChessPie for new and advanced users. The goal is to provide a quick entry point while still offering enough depth for more complex use cases.

---

## Board Editor

### What is the Board Editor?

The Board Editor is the tool you use to create custom game boards for ChessPie. A board defines the playing field: its size, which squares are playable, starting positions, and board-level rules.

In short: the Board Editor defines the structure of the game.

### How does the Board Editor work?

1. **Set the board size**  \
   First, you define the dimensions of the board (e.g. 8×8, 10×10, or any custom size) by resizing the grid.

2. **Edit squares**  \
   Individual squares are intentionally kept simple. Each square currently has exactly one configurable property:

   - Active / inactive (playable or blocked)

   Inactive squares are not part of the playing field and cannot be entered or occupied by pieces.

3. **Set starting positions**  \
   Define which pieces start on which squares. These positions are used as the initial setup for new games played on this board.

4. **Board-level rules**  \
   Some rules apply to the board itself rather than to individual pieces (for example: blocked areas or special zones).

5. **Save & test**  \
   Your board can be saved at any time and tested directly in game mode — even by playing against yourself. You can find it in your library.

### You’re done – what can you do with the board?

You can:

- test the board by playing against yourself
- play on it with others
- share it with other players
- edit or extend it later

The Board Editor is intentionally flexible. You are encouraged to experiment without having to commit to a final design immediately.

---

## Piece Editor

> Note: This article describes the core idea only. Detailed behavior can be added later.

### What is the Piece Editor?

The Piece Editor is the counterpart to the Board Editor. While the board defines the playing field, pieces define how the game is played: how they move, capture, and interact with the board and other pieces.

### Design

This section focuses on the visual appearance of a piece:

- Icon or graphic
- Color / variants
- Orientation (e.g. depending on the player)

Design has no influence on the rules, but it is essential for clarity and recognition.

### Rules

#### Fundamental

The basic properties of a piece:

- Can it move?
- Can it capture?
- Does it belong to a player or is it neutral?

#### Detailed

This is where behavior is defined precisely:

- Movement patterns (directions, range)
- Conditions (e.g. only on the first move)
- Special rules (transformations, blocking, dependencies on specific squares)

### At the end

A piece is only complete when design and rules work together cleanly. The goal is for every piece to be clear, consistent, and predictable.

!Pieces can only be placed via the Board Editor!

### Sets

Group related pieces into a set. These sets can later be imported into the Board Editor.

---

## Game

### Stockfish

ChessPie can use Stockfish as an engine. Stockfish allows:

- playing against an AI
- position analysis
- comparing different boards and rule sets

Depending on the complexity of the rules, engine behavior may vary.

### Room Code

A room code lets you share games easily:

- other players can join directly
- ideal for private matches or testing

The code ensures that all players use the same rules, boards, and pieces.

### Chess rules

ChessPie is conceptually based on chess, but extends it:

- classical rules only apply if you define them
- deviations are explicitly allowed
- custom rule sets override standard chess

The system is rule-driven: “chess” is not the default — your configuration is.

---

If you want, these articles can later be expanded, split up, or SEO-optimized (for example with examples, screenshots, or step-by-step guides).

