import { Square } from './types';

export function toCoords(square: Square): [number, number] {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(square[1], 10) - 1;
    return [file, rank];
}

export function toSquare(coords: [number, number]): Square {
    const file = String.fromCharCode('a'.charCodeAt(0) + coords[0]);
    const rank = coords[1] + 1;
    return `${file}${rank}` as Square;
}
