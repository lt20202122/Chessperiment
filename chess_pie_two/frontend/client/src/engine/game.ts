import { type Square } from './types'
import {ValidatorClass} from './rules'
{/*
1. Functions:
 - makeMove()
 - 


*/}

export class Game {
    validator: ValidatorClass;
    constructor() {
        this.validator = new ValidatorClass();
    }
    makeMove({ from, to }: { from: Square, to: Square }) {
        if (!this.validator.isLegal(from, to)) return false;
        // make move and send it to board.ts
        return true;
    }
}

// btw we definitely need a function to convert "from" and "to" into numbers