from legal_move.legal_move import *
from legal_move.legal_move import *

class Piece:
    def __init__(self, x, y, piece_type):
        self.x = x
        self.y = y
        self.type = piece_type
        self.legalMoves = []

        if x == 1 or x == 2:
            self.color = "white"
        elif x == 7 or x == 8:
            self.color = "black"
        else:
            self.color = None

        self.legalMoves = findOutLegalMoves(self.x, self.y, self.type)

    def __repr__(self):
        return f"{self.color} {self.type} at ({self.x}, {self.y})"


class Rook(Piece):
    def __init__(self, x, y):
        super().__init__(x, y, "Rook")


class Knight(Piece):
    def __init__(self, x, y):
        super().__init__(x, y, "Knight")
        print("Hello")


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
