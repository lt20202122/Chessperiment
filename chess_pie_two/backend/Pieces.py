from legal import *
from utils import convert_coord

class Piece:
    def __init__(self, x, y, piece_type): #NOTE: We are here using the 1-1 format for coord
        self.x = x
        self.y = y
        self.type = piece_type

        if x == 1 or x == 2:
            self.color = "white"
        elif x == 7 or x == 8:
            self.color = "black"
        else:
            self.color = None


    def __repr__(self):
        return f"{self.color} {self.type} at ({self.x}, {self.y})"


class Rook(Piece):
    def __init__(self, x, y):
        super().__init__(x, y, "Rook")


class Knight(Piece):
    def __init__(self, x, y):
        super().__init__(x, y, "Knight")


class Bishop(Piece):
    def __init__(self, x, y):
        super().__init__(x, y, "Bishop")


# ♛ Dame
class Queen(Piece):
    def __init__(self, x, y):
        super().__init__(x, y, "Queen")


class King(Piece):
    def __init__(self, x, y):
        super().__init__(x, y, "King")


class Pawn(Piece):
    def __init__(self, x, y):
        super().__init__(x, y, "Pawn")
        self.movedOnce = False
