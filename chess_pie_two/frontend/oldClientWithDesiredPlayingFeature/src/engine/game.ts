import { type Square } from './types'
import { ValidatorClass } from './rules'
import { BoardClass } from './board'

export class Game {
    private board: BoardClass;
    private validator: ValidatorClass;

    constructor(customBoard?: BoardClass) {
        this.board = customBoard || new BoardClass();
        this.validator = new ValidatorClass(this.board);
    }

    makeMove(from: Square, to: Square, promotion?: string): boolean {
        if (this.validator.isLegal(from, to)) {
            return this.board.movePiece(from, to, promotion);
        }
        return false;
    }

    getBoard(): BoardClass {
        return this.board;
    }

    getTurn(): "white" | "black" {
        return this.board.getTurn();
    }
}
