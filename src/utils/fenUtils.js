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
/**
 * Returns the piece character at a given square in a FEN string, or null if empty.
 * e.g. getPieceAtSquare("rnbqkbnr/...", "e1") → 'K'
 */
export const getPieceAtSquare = (fen, square) => {
    const fenPosition = fen.split(' ')[0];
    const ranks = fenPosition.split('/');
    const file = square.charCodeAt(0) - 97; // 'a' = 97
    const rank = parseInt(square[1]) - 1;   // 0-indexed
    const rankStr = ranks[7 - rank];        // FEN lists rank 8 first
    let col = 0;
    for (const ch of rankStr) {
        if (ch >= '1' && ch <= '8') {
            col += parseInt(ch);
        } else {
            if (col === file) return ch;
            col++;
        }
    }
    return null;
};

export const getFenAtIndex = (startFen, moves, n) => {
    if (n <= 0 || !moves.length) return startFen;
    const chess = new Chess(startFen);
    const count = Math.min(n, moves.length);
    for (let i = 0; i < count; i++) {
        try { chess.move(moves[i]); } catch (_) { /* skip invalid */ }
    }
    return chess.fen();
};
