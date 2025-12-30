import { type Square } from './types'
import { ValidatorClass } from './rules'
import { BoardClass } from './board'

export class Game {
    private board: BoardClass;
    private validator: ValidatorClass;

    constructor() {
        this.board = new BoardClass();
        this.validator = new ValidatorClass(this.board);
    }

    makeMove(from: Square, to: Square): boolean {
        if (this.validator.isLegal(from, to)) {
            this.board.movePiece(from, to);
            return true;
        }
        return false;
    }

    getBoard(): BoardClass {
        return this.board;
    }
}
