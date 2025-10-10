from Game import *
from app import *

def isLegal(game,start,end,took):
    start11 = _convert_coord_to_num(start,1)
    end11 = _convert_coord_to_num(end,1)
    start00 = _convert_coord_to_num(start,0)
    end00 = _convert_coord_to_num(end,0)

    # which piece is moved?
    if _simpleMoves(game,start,end,took) == False:
        return False;
    # is piece blocking?
    trace = _get_trace(start00, end00)
    isBlocking = _is_blocking(trace, game)

def _simpleMoves(game,start,end,took):
    moved_piece = game.board[start[0],start[1]]
    print(moved_piece);
    dx = abs(start[0]-end[0])
    dy = abs(start[1]-end[1])
    match moved_piece.type:
        case "Rook":
            if end[0] != start[0] and end[1] != start[1]:
                return False;
        case "Knight":
            if not ((dy == 2 and dx==1) or (dy==1 and dx==2)):
                return False
        case "Bishop":
            if dx != dy:
                return False
        case "Pawn":
            if (dx < 1 or dy < 1) or (dx != 0 and took=="false"):
                return False
        case "King":
            if dx < 1 or dy < 1:
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
    trace = []

    dx = end[0] - start[0]
    dy = end[1] - start[1]

    step_x = (dx > 0) - (dx < 0)  # +1, -1 oder 0
    step_y = (dy > 0) - (dy < 0)  # +1, -1 oder 0

    x, y = start
    while (x, y) != (end[0] - step_x, end[1] - step_y):
        x += step_x
        y += step_y
        trace.append((x, y))

    return trace

def _is_blocking(trace, game):
    for i in trace:
        if i != None 


def _convert_coord_to_num (coord,wish):
    tiles = ["A", "B", "C", "D", "E", "F", "G", "H"]
    value=[]
    value.append(coord[0])
    value = tiles.index([coord[1]])
    if wish == 1:
        value[1] +1
    return value