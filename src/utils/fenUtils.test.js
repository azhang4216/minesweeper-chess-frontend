import { getFenAtIndex } from './fenUtils';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
// chess.js v1 only includes an en passant square in FEN when a pawn can legally capture it
const AFTER_E4_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const AFTER_E4_E5_FEN = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
// Explosion SANs: underlying move applied then destination square cleared
// e4💣💥 → white pawn moves to e4 then detonates → e4 square empty, black to move
const AFTER_E4_EXPLOSION_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
// e4 then e5💣💥 → black pawn moves to e5 then detonates → e5 square empty, white to move
const AFTER_E4_E5_EXPLOSION_FEN = 'rnbqkbnr/pppp1ppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';

describe('getFenAtIndex', () => {
    test('n=0 returns startFen unchanged', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], 0)).toBe(START_FEN);
    });

    test('negative n returns startFen', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], -1)).toBe(START_FEN);
    });

    test('empty moves array returns startFen regardless of n', () => {
        expect(getFenAtIndex(START_FEN, [], 5)).toBe(START_FEN);
    });

    test('n=1 returns FEN after first move', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], 1)).toBe(AFTER_E4_FEN);
    });

    test('n=2 returns FEN after second move', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], 2)).toBe(AFTER_E4_E5_FEN);
    });

    test('n greater than moves.length replays all available moves', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], 100)).toBe(AFTER_E4_E5_FEN);
    });

    test('invalid SAN moves are skipped silently and valid moves still apply', () => {
        // 'INVALID' is skipped; 'e4' is applied; result is same as replaying only e4
        const result = getFenAtIndex(START_FEN, ['INVALID', 'e4'], 2);
        expect(result).toBe(AFTER_E4_FEN);
    });

    describe('explosion SANs (💣💥 suffix)', () => {
        test('explosion SAN applies the move then removes the piece from the destination', () => {
            // e4💣💥: white pawn moves to e4 and detonates — e4 square cleared
            expect(getFenAtIndex(START_FEN, ['e4💣💥'], 1)).toBe(AFTER_E4_EXPLOSION_FEN);
        });

        test('explosion SAN mid-sequence: preceding moves replay correctly', () => {
            // e4 (normal) then e5💣💥 (black pawn detonates on e5)
            expect(getFenAtIndex(START_FEN, ['e4', 'e5💣💥'], 2)).toBe(AFTER_E4_E5_EXPLOSION_FEN);
        });

        test('explosion SAN at index boundary: n=1 only replays the explosion move', () => {
            // Two-move list but only replay the first (explosion) — second move not applied
            expect(getFenAtIndex(START_FEN, ['e4💣💥', 'e5'], 1)).toBe(AFTER_E4_EXPLOSION_FEN);
        });

        test('invalid explosion SAN is skipped silently', () => {
            // 'INVALID💣💥' should be skipped; 'e4' still applied
            expect(getFenAtIndex(START_FEN, ['INVALID💣💥', 'e4'], 2)).toBe(AFTER_E4_FEN);
        });
    });
});
