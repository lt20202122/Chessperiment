import { type Square } from './types'
import { ValidatorClass } from './rules'
import { Board } from './board'

export class Game {
    private board: Board;
    private validator: ValidatorClass;

    constructor() {
        this.board = new Board();
        this.validator = new ValidatorClass(this.board);
    }

    makeMove(from: Square, to: Square): boolean {
        if (this.validator.isLegal(from, to)) {
            this.board.movePiece(from, to);
            return true;
        }
        return false;
    }

    getBoard(): Board {
        return this.board;
    }
}
