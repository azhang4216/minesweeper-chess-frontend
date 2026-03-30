import { Chess } from 'chess.js';

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const STARTING_COUNT = { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 };

/**
 * Given a FEN, returns which pieces have been captured and the material advantage.
 * capturedByWhite: black piece types that white has taken (e.g. ['p','p','n'])
 * capturedByBlack: white piece types that black has taken
 * materialAdv: positive = white ahead, negative = black ahead
 */
export const getCapturedPieces = (fen) => {
    if (!fen) return { capturedByWhite: [], capturedByBlack: [], materialAdv: 0 };

    const placement = fen.split(' ')[0];
    const onBoard = {
        w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
        b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    };

    for (const ch of placement) {
        if (ch === '/' || (ch >= '1' && ch <= '8')) continue;
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toLowerCase();
        if (type in onBoard[color]) onBoard[color][type]++;
    }

    const capturedByWhite = [];
    const capturedByBlack = [];

    for (const [type, startCount] of Object.entries(STARTING_COUNT)) {
        const blackMissing = Math.max(0, startCount - onBoard.b[type]);
        for (let i = 0; i < blackMissing; i++) capturedByWhite.push(type);

        const whiteMissing = Math.max(0, startCount - onBoard.w[type]);
        for (let i = 0; i < whiteMissing; i++) capturedByBlack.push(type);
    }

    const whiteScore = capturedByWhite.reduce((s, t) => s + PIECE_VALUE[t], 0);
    const blackScore = capturedByBlack.reduce((s, t) => s + PIECE_VALUE[t], 0);

    return { capturedByWhite, capturedByBlack, materialAdv: whiteScore - blackScore };
};

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
        const san = moves[i];
        if (san.endsWith('💣💥')) {
            // Explosion move: replay the underlying chess move, then remove the piece
            // (mirroring the server-side room.game.move() + room.game.remove(to) sequence)
            try {
                const result = chess.move(san.slice(0, -'💣💥'.length));
                if (result) chess.remove(result.to);
            } catch (_) { /* skip if somehow invalid */ }
        } else {
            try { chess.move(san); } catch (_) { /* skip invalid */ }
        }
    }
    return chess.fen();
};
