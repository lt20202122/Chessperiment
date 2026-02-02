# ♟️ chessperiment.app

### The Ultimate Sandbox for Custom Chess Variants

**[chessperiment.app](https://chessperiment.app)** is a web-based chess engine designed for total customization. Unlike standard chess platforms, Chessperiment features a **Scratch-inspired logic editor** that allows you to define unique behaviors for every piece and board.

---

## 🚀 Key Features

- **Custom Piece Creator:** Design pieces with advanced logic. Create "Invincible" pieces that insta-kill attackers or "Cursed" pieces that die the moment they are threatened.
- **Visual Logic Editor:** Built with a custom drag-and-drop system powered by `dnd-kit`. No coding required—just drag triggers and effects.
- **Dynamic Board Shapes:** Go beyond the 8x8 grid with highly customizable board topologies.
- **Play Anywhere:** Challenge a specialized **Stockfish** integration or play against real users in real-time.

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (React)
- **Backend:** [Express.js](https://expressjs.com/) (Node.js) for real-time multiplayer and engine integration.
- **UI/Interaction:** `dnd-kit` for the visual logic builder.
- **Engine:** Stockfish integration for AI gameplay.

## 🧠 How the Logic Engine Works

Chessperiment uses a trigger-effect architecture. Every piece can have unique event listeners:

- **Triggers:** `onThreatened`, `onCapture`, `onMove`, `onGameStart`.
- **Effects:** `killAttacker`, `spawnPiece`, `changeVariable`, `instantlyDie`.

This specific structure allows for variants that are impossible on other platforms.

## 🤝 Contributing & Community

I am currently the sole developer of this project!

- **Goal:** Building a community of variant creators and enthusiasts.
- **Feedback:** If you find a bug or have a logic trigger suggestion, please open an Issue.
- **Community:** Join the discussion on our [Subreddit](YOUR_REDDIT_LINK) or follow development on [Twitter/GitHub](YOUR_LINK).

## 📜 License

See LICENSE.md
