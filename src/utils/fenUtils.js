import { Chess } from 'chess.js';

/**
 * Returns the FEN string after applying `n` moves from `startFen`.
 * n = 0  → returns startFen (position before any move)
 * n = 1  → returns FEN after first move
 * n = k  → returns FEN after moves[0..k-1]
 *
 * If n >= moves.length, replays all available moves.
 * Invalid SANs are skipped silently (can happen with bomb-explosion positions
 * where the FEN diverges; we still want partial replay to work).
 */
export const getFenAtIndex = (startFen, moves, n) => {
    if (n <= 0 || !moves.length) return startFen;
    const chess = new Chess(startFen);
    const count = Math.min(n, moves.length);
    for (let i = 0; i < count; i++) {
        try { chess.move(moves[i]); } catch (_) { /* skip invalid */ }
    }
    return chess.fen();
};
