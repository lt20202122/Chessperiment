# TODO

- [ ] Entferne in /public alle Elemnte, die nicht gebraucht werden. Aber immer Doppelchecken!

## Piece Editor
- [ ] Implement save to database, see PieceEditorSidebar.tsx, Line 19!

## History Mode
- [ ] Often, the History Mode just doesn't work, jumping right to the first move.
- [ ] Add move highlighting in History Mode.

## Responsiveness
- [ ] Make the homepage responsive for all screen sizes (the desktop version is the only one that works).
- [ ] Make /game responsive for all screen sizes (the desktop version is the only one that works). The board should have some margin, and right now, it's almost cut-off, only if you scroll down, zoom out and scroll back up, it fits.
- [ ] Make /editor responsive for all screen sizes (the desktop version is the only one that works). I mean /editor/board and /editor/piece.

## Effects
- [ ] On win / loss / draw, show some really cool Effect as Feedback over the board.
- [ ] on Mobile Mode, you basically never know when for example a checkmate happens, or your opp offered a draw, because you'd have to scroll down to see that.

## Chat
- [ ] Add an Ingame-Chat. Some of the logic might already be implented in thze client, pls check for that

- [ ] Add some kind of security to the chat, so that no one can spam the chat or write something offensive.

## Announcements
- [ ] Create a /announcements page where we have articles with autor and date, about new features. An announcemtn should have a big picture, and then a title und short description. When aou click on it, you get to /&announcement/[id], where you can read the ful article. You should get the info from a js-file, that contains text, date, picture etc.

## Sharing games
- [ ] Add a feature where you can click a button and then yopu get an invite link that you can share. You need  to open this classic share window, where you can ssend to WhatsApp or smth. Also use ImageResponse from vercel to create OG-images

## Quick search
- [ ] Add a feature where you can use a quick search to search for games that are open, so you can join them if thewy also clicked quick searcxh. You knowwhat I mean, standar quick search

## Marketplace (!DONT DO THAT YET, THE IDEA IS NOT FINISHED, IGNORE THIS PARAGRAPH!)
- [ ] Add a Marketplace for Boards, Pieces and Designs. Some should be free, but also create a buying mockup. 
- [ ] Add a way to rate and review the boards, pieces and designs. You should be able to see the average rating and the number of reviews, as well as the reviews of other users.
- [ ] Add a way to search for boards, pieces and designs.
- [ ] Add a way to sort the boards, pieces and designs by rating, number of reviews, price, etc.
- [ ] Add a way to filter the boards, pieces and designs by category, price, etc.
- [ ] Add everything to the database.
- [ ] You should only be able to buy boards, pieces and designs if you are logged in.
- [ ] You should be able to see your purchases in your profile.
- [ ] You should be able to sell your boards, pieces and designs.
- [ ] Take a look at the figma screenshot for the idea and layout.

## Random
- [ ] Make the color selection random when starting a new game.
- [ ] In /editor/board, make the UX way cleaner. The feedback should be way more direct, one flick and it should be applied. Also adjust the piece size, you can use the browser for that (for real, request to do so).

## Login Error
- [ ] On login   to api/auth/error. Every singe time.

## Computer
- [ ] Add a button to the panel to where you can enter the room code or create one, and when you click it, it asks you which Elo to play against. After you selected one, you play against stockfish (use the package stockfish.js)

## SEO
- [ ] Nutze next/image anstatt >img<! Ersetze jedes >img< durch next/image
- [ ] Füge alt-texte auf Deutsch + Englisch überall hinzu
- [ ] Add loading=lazy to all images that are below the fold
- [ ] Add 'priority' to all images that are rendered when the site is accessed

## Game-funtionaltiy
- [ ] When the opponent or you make a move, the entire board gets rendered new, resulting in an ugly flash. Pls remove that, search the internet to see, what you can do against it, and/or use your own knowledge

## FAQ-Page
Erstelle eine Next.js App Router Page unter /editor/board/faq
- Nutze TypeScript
- Exportiere ein Metadata-Objekt vom Typ Metadata
- Titel: "ChessPie Board Editor FAQ – Alle Antworten"
- Description: "Hier findest du alle häufigen Fragen zum ChessPie Board Editor, inklusive Tipps zum Erstellen eigener Boards und Figuren."
- Open Graph: Titel + Description + Bild "editor-board-faq.png"
- Twitter Card: Titel + Description + Bild "editor-board-faq.png"
- JSON-LD: FAQPage mit mindestens 5 typischen Fragen zum Board-Editor
- Jede Frage soll eine präzise Antwort enthalten
- Seite soll SEO-optimiert sein, Canonical auf https://chesspie.de/editor/board/faq
- Page soll responsive sein, Tailwind CSS nutzen
- Keine unnötigen Komponenten, nur sauberes Layout mit Headline, FAQ-Liste, eventuell Accordion für Antworten
- Exportiere die Page als Standard Next.js page.tsx für App Router

## Instructions
If you spot a task that is not completed, please do it. If you spot a task that is completed, please remove it from the list.

# Backlog (dont do these unless you're really really bored)
## Report
- [ ] Add a report-feature, where you can report those game during or after a game. It should be sent to a database where I can as admin ban players