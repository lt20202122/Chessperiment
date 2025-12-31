
import { Game } from './game';
import { Square } from './types';

const testMove = (game: Game, from: Square, to: Square, expected: boolean) => {
    const result = game.makeMove(from, to);
    console.log(`Move ${from} -> ${to}: expected ${expected}, got ${result}`);
    if (result !== expected) {
        console.error(`  [FAIL] Move ${from} -> ${to}: expected ${expected}, got ${result}`);
    } else {
        console.log(`  [PASS] Move ${from} -> ${to}: expected ${expected}, got ${result}`);
    }
};

const runTests = () => {
    let game: Game;

    console.log('--- VALID GAME SEQUENCE ---');
    game = new Game();
    testMove(game, 'e2', 'e4', true);  // White
    testMove(game, 'e7', 'e5', true);  // Black
    testMove(game, 'g1', 'f3', true);  // White
    testMove(game, 'b8', 'c6', true);  // Black
    testMove(game, 'f1', 'b5', true);  // White
    testMove(game, 'a7', 'a6', true);  // Black

    console.log('\n--- ILLEGAL MOVES ---');
    game = new Game();
    // 1. Moving opponent's piece
    testMove(game, 'e7', 'e5', false); // White tries to move black pawn

    // 2. Moving to a square occupied by own piece
    testMove(game, 'e2', 'e3', true);
    testMove(game, 'e7', 'e6', true);
    testMove(game, 'd1', 'd2', false); // White queen tries to move to square occupied by white pawn

    // 3. Invalid pawn moves
    game = new Game();
    testMove(game, 'e2', 'e5', false); // Invalid 3-square move
    testMove(game, 'd2', 'd5', false); // Invalid 3-square move

    // 4. Knight moving like a rook
    game = new Game();
    testMove(game, 'g1', 'g3', false);

    // 5. Moving through another piece (rook)
    game = new Game();
    testMove(game, 'h1', 'h5', false);
};

runTests();
