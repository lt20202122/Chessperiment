# Starting a game
## Frontend:
`fetch ((...)/start)`

## app.py (backend)
`@route(/start)`
game wird inititalisiert
--> 1. Pieces werden erstellt
            piece.x --> 1-1
            piece.y --> 1-1
            self.color --> "white", "black"
        Board wird erstellt

## Frontend (Board.tsx)
--> Piece moved 
Move analysis
`fetch (...)/move?move=${startPos}-${pos}-${take}` -->/move?move=e2-e3

## Backend (app.py)
`legal = isLegal(game,start,end,took)` //start und end sind hier im a-1 Format

## legal.py
#### isLegal()

