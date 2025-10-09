from Pieces import *

class Game():
    def __init__(self):
        white_rook1 = Rook(1, 1)
        white_knight1 = Knight(1, 2)
        white_bishop1 = Bishop(1, 3)
        white_queen = Queen(1, 4)
        white_king = King(1, 5)
        white_bishop2 = Bishop(1, 6)
        white_knight2 = Knight(1, 7)
        white_rook2 = Rook(1, 8)
        white_pawns = [Pawn(2, i) for i in range(1, 9)]

        black_rook1 = Rook(8, 1)
        black_knight1 = Knight(8, 2)
        black_bishop1 = Bishop(8, 3)
        black_queen = Queen(8, 4)
        black_king = King(8, 5)
        black_bishop2 = Bishop(8, 6)
        black_knight2 = Knight(8, 7)
        black_rook2 = Rook(8, 8)
        black_pawns = [Pawn(7, i) for i in range(1, 9)]

        self.board = [
            [white_rook1, white_knight1, white_bishop1, white_queen, white_king, white_bishop2, white_knight2, white_rook2],
            white_pawns,
            [None]*8,
            [None]*8,
            [None]*8,
            [None]*8,
            black_pawns,
            [black_rook1, black_knight1, black_bishop1, black_queen, black_king, black_bishop2, black_knight2, black_rook2]
        ]

def Start():
    game=Game()