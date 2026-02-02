# Project Redesign Overview

We are doing a full redesign of the editor interface and project structure:

- **Header:** Only one link, pointing to `/editor`.
- **Editor landing (`/editor`):** Displays all projects. Users can create new projects or open existing ones.
- **Project page (`/editor/{projectId}`):** Shows the board for the selected project.
- **Sidebar (right, ~100px wide):**
  - Two icons: **Board Editor** and **Piece Editor** (pawn icon).
  - Hover tooltips appear after 2 seconds to describe each editor.
  - Clicking an icon redirects to `/editor/{projectId}/board-editor` or `/editor/{projectId}/piece-editor`.
- **Piece placement panel (bottom, ~20px height):**
  - Sticky positioning.
  - Clickable arrow expands it to 1/3 screen height.
  - Displays all created pieces plus default pieces.
  - Two modes: **White** and **Black**, switchable via a handle at the top.
  - Pieces can be dragged onto the board or clicked and placed on a square directly.

**Notes:**

- The old "set" logic is removed. Each project now only contains the pieces you’ve created.
- Gameplay features (play button, publish, etc.) are not removed but stored safely for future use.
- Focus now is on editing and piece placement; gameplay integration will come later.
