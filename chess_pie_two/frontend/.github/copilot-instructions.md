# GitHub Copilot instructions — chess_pie

Summary
- This repo contains a Next.js frontend (client/) and a TypeScript socket server (server/). The client is a React/Next app that connects to the server over socket.io for multiplayer games. The server uses chess.js for rules and enforces game flow.

Architecture & important files
- Frontend (client/)
  - client/src/app/[locale]/game/Board.tsx — primary game UI and move handling
  - client/src/app/[locale]/game/SocketComponent.tsx — socket.io client, registers playerId (localStorage), creates/joins rooms and listens to server events
  - Environment: uses NEXT_PUBLIC_SOCKET_URL (default: http://localhost:3001)
- Server (server/)
  - server/new_server.ts — current server-side event handlers; Game class, checkGameStatus, promotion flow, request_fen/history, rejoin logic
  - server/server.ts — alternate/older server implementation with reconnection/ratelimiting; read for examples of production-ready patterns
  - tsconfig.json → outputs to dist/ when compiled (npx tsc -p tsconfig.json)

Developer workflows (concrete commands)
- Frontend (dev):
  - cd client && npm install && npm run dev
- Frontend (build & start):
  - cd client && npm run build && npm run start
- Server (build & run):
  - cd server && npx tsc -p tsconfig.json
  - node dist/new_server.js
  Note: package.json currently sets "dev": "node new_server.ts" — Node can't run .ts directly unless you add ts-node. Use the compile+node flow or add ts-node as a devDependency.

Socket protocol (key events & payloads)
- Client → Server (examples):
  - register_player: { playerId: string } — required on connect (see SocketComponent.tsx)
  - create_room: ()
  - join_room: { roomId: string }
  - move: { from: "e2", to: "e4", promotion?: "q" }
  - promotion_done: { promotion: "q" }
  - request_fen / request_history / request_game_status
- Server → Client (examples):
  - room_created: { roomId }
  - joined_room: { roomId, color }
  - start_game: { roomId, fen, color }
  - rejoin_game: { roomId, color, fen, status }
  - move: { from, to, promotion|null, san, fen, gameStatus }
  - promotion_needed: { from, to }
  - illegal_move: { reason }
  - game_ended: { reason, result, status }

Project-specific conventions & patterns
- Board state: server stores board as FEN (string). Clients send only moves ({from,to}), server computes legality and responds with new FEN and SAN history.
- History: move history stored as SAN strings (see Game.history in server/new_server.ts)
- Player mapping: server Game.getColorForPlayer returns 'w'|'b'; client maps to 'white'|'black'. Keep mapping consistent when adding features.
- Room keys and IDs: server generates uppercase room codes; client and server expect uppercase room codes on join.
- Promotion flow: server sets Game.pendingMove and emits promotion_needed; client then sends promotion_done with chosen piece.
- Local state: client stores a persistent playerId in localStorage (see SocketComponent.tsx). Respect this for reconnect flow.
- UI strings: some UI and comments are in German — if changing UI text, check localization files in client/src/messages/

Safety & tests
- There are currently no test suites in the workspace. When adding behavior-sensitive changes (game rules, move validation), add unit tests for chess logic (using chess.js to validate expected behaviors) and socket integration tests if possible.

When modifying socket events
- Update server and all client handlers together (search for event names across `client/src` and `server/`). Use the stable event names listed above.
- Add clear error reasons (e.g., 'not_in_room', 'not_your_turn', 'illegal_move') so the client can display user-friendly messages (see Board.tsx and SocketComponent.tsx handlers).

Helpful tips for contributors
- If you encounter a failing dev start for the server, run the explicit build step (npx tsc) and then node the compiled file in `dist/`.
- To change the server's listening port, set PORT env var before running (default 3001).
- Rate limits and reconnection behavior are implemented in `server/server.ts` (good examples to follow when hardening `new_server.ts`).

Where to look first when changing features
- UI/UX changes → client/src/app/[locale]/game (Board.tsx, SocketComponent.tsx)
- Rules/game state → server/new_server.ts (checkGameStatus, Game class) and server/server.ts for production patterns
- Common utilities → client/src/app/[locale]/game/utilities.ts and client/src/lib

What I did and how to iterate
- I drafted this guidance based on the code I inspected (Board.tsx, SocketComponent.tsx, new_server.ts, server.ts, client package.json).
- If you'd like, I can: (A) add quick start scripts to package.json for a better dev DX, (B) add a minimal test harness for server move validation, or (C) include more protocol examples and TypeScript types for the socket messages.

Please review this file and tell me any missing details or additional examples you want included — I can iterate quickly.