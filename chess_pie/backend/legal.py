from utils import convert_coord

def isLegal(game,start,end,took):
    print("start in isLegal: ",start, " end in isLegal: ",end)
    start11 = convert_coord(start,1)
    end11 = convert_coord(end,1) 
    start00 = convert_coord(start,0)
    end00 = convert_coord(end,0)
    print("start00 in isLegal: ", start00, "end00 in isLegal: ",end00) # yx
    moved_piece = game.board[start00[0]][start00[1]] 


    # Is the move even thinkable for that specific piece?
    if _simpleMoves(game,start00,end00,took, moved_piece) == False:
        print("Simple Moves denied")
        return False
    # is a piece blocking? (No piece can block the knight)
    if moved_piece.type != "Knight":
        trace = _get_trace(start00, end00)
        if _is_blocking(trace, game.board) == True:
            print("isBlocking denied")
            return False
    return True
    
    

def _simpleMoves(game,start,end,took,moved_piece): # start, end
    print("Simple Moves started")
    print("start in _simpleMoves (start00): ",start, "end in _simpleMoves (end00): ",end)
    print("Start[0]: ",start[0], "Start [1]: ",start[1]) # yx 00
    print("Game.board: ",game.board[start[0]][start[1]]) # yx 00
    print("Moved Piece: ",moved_piece);
    dx = abs(start[1]-end[1]) # reihe, spalte, y, x
    dy = abs(start[0]-end[0])
    print("dx: ", dx, " dy: ",dy)
    match moved_piece.type:
        case "Rook":
            if end[0] != start[0] and end[1] != start[1]:
                return False;
        case "Knight":
            if not ((dy == 2 and dx==1) or (dy==1 and dx==2)):
                print("Wrong Knight Move")
                return False
        case "Bishop":
            if dx != dy:
                return False
        case "Pawn":
            if moved_piece.movedOnce == False:
                if (dx > 1 or dy > 2) or (dx > 0 and took=="false"):
                    return False
            else:
                if (dx > 1 or dy > 2) or (dx > 0 and took=="false"):
                    return False
        case "King":
            if dx < 1 or dy < 1:
                print("King moved")
                return False
        case "Queen":
            if dx == 0 or dy == 0:
                return True;
            if dx == dy:
                return True
            else:
                return False
    return True

def _get_trace(start, end):
    print("calc trace")
    trace = []

    dx = end[0] - start[0]
    dy = end[1] - start[1]

    step_x = (dx > 0) - (dx < 0)
    step_y = (dy > 0) - (dy < 0) 

    x, y = start
    while (x, y) != (end[0] - step_x, end[1] - step_y):
        x += step_x
        y += step_y
        trace.append((x, y))

    return trace

def _is_blocking(trace, board):
    print("Starting is_blocking")
    print("Trace: ",trace)
    for i in trace:
        print("i: ",i)
        a = list(i)
        # a contains 0-based coords already
        if board[a[0]][a[1]] is not None:
            return True
    return False