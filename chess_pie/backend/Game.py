from Pieces import *
class GameClass():
    def __init__(self):
        #NOTE: We here use the 1-1 format.
        self.white_rook1 = Rook(1, 1)
        self.white_knight1 = Knight(1, 2)
        self.white_bishop1 = Bishop(1, 3)
        self.white_queen = Queen(1, 4)
        self.white_king = King(1, 5)
        self.white_bishop2 = Bishop(1, 6)
        self.white_knight2 = Knight(1, 7)
        self.white_rook2 = Rook(1, 8)
        self.white_pawns = [Pawn(2, i) for i in range(1, 9)]

        self.black_rook1 = Rook(8, 1)
        self.black_knight1 = Knight(8, 2)
        self.black_bishop1 = Bishop(8, 3)
        self.black_queen = Queen(8, 4)
        self.black_king = King(8, 5)
        self.black_bishop2 = Bishop(8, 6)
        self.black_knight2 = Knight(8, 7)
        self.black_rook2 = Rook(8, 8)
        self.black_pawns = [Pawn(7, i) for i in range(1, 9)]

        self.board = [
            [self.white_rook1, self.white_knight1, self.white_bishop1, self.white_queen, self.white_king, self.white_bishop2, self.white_knight2, self.white_rook2],
            self.white_pawns,
            [None]*8,
            [None]*8,
            [None]*8,
            [None]*8,
            self.black_pawns,
            [self.black_rook1, self.black_knight1, self.black_bishop1, self.black_queen, self.black_king, self.black_bishop2, self.black_knight2, self.black_rook2]
        ] #NOTE: So we basically have white at the bottom and black at the top
    def update_board(self,start, end): #NOTE: move is in 0-0 format
        whatsMoved = self.board[start[0]][start[1]]
        # change it
        self.board[end[0]][end[1]] = whatsMoved
        self.board[start[0]][start[1]] = None
        # convert nested-list 0-based coords back to your Piece 1-based coords
        whatsMoved.x = end[0] + 1
        whatsMoved.y = end[1] + 1
        for i in self.board:
            print("Board :",i)