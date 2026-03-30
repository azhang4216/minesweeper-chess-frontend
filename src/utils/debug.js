// ─── Debug flag ────────────────────────────────────────────────────────────
// Set to false before shipping. Dead-code eliminated by minifiers when false.
export const DEBUG = true;

/** Gated console.log. Use this instead of console.log throughout the app. */
export const dbg = (tag, ...args) => {
    if (!DEBUG) return;
    console.log(`[${tag}]`, ...args);
};

// ─── Board visualization ────────────────────────────────────────────────────

const parseFenGrid = (fen) => {
    const ranks = fen.split(' ')[0].split('/');
    return ranks.map(rankStr => {
        const row = [];
        for (const ch of rankStr) {
            if (ch >= '1' && ch <= '8') {
                for (let i = 0; i < parseInt(ch); i++) row.push('.');
            } else {
                row.push(ch);
            }
        }
        return row;
    });
    // grid[0] = rank 8 (top of board), grid[7] = rank 1 (bottom)
};

/**
 * Renders a labeled ASCII board to the console with bomb/crater overlays.
 *
 * Markers:
 *   X  = my unexploded bomb
 *   ?  = opponent's unexploded bomb (hidden — count only shown in summary)
 *   *  = crater (bomb already detonated here)
 *   uppercase letter = white piece (P N B R Q K)
 *   lowercase letter = black piece (p n b r q k)
 *   .  = empty square
 *
 * @param {string} fen  - Current FEN string
 * @param {Object} opts
 * @param {string[]} opts.myBombs   - My unexploded bomb squares, e.g. ['d3','e4']
 * @param {string[]} opts.craters   - Exploded squares, e.g. ['f5']
 * @param {number}   opts.oppBombCount - Number of opponent's bombs still placed (hidden)
 */
export const dbgBoard = (fen, { myBombs = [], craters = [], oppBombCount = 0 } = {}) => {
    if (!DEBUG || !fen) return;

    let grid;
    try { grid = parseFenGrid(fen); } catch { return; }

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const lines = ['  a b c d e f g h'];

    for (let r = 0; r < 8; r++) {
        const rankNum = 8 - r;
        let line = `${rankNum} `;
        for (let f = 0; f < 8; f++) {
            const sq = files[f] + rankNum;
            if (craters.includes(sq)) {
                line += '* ';
            } else if (myBombs.includes(sq)) {
                line += 'X ';
            } else {
                line += (grid[r]?.[f] ?? '.') + ' ';
            }
        }
        lines.push(line.trimEnd());
    }

    const summary = [
        `My bombs   : ${myBombs.length > 0 ? myBombs.join(', ') : '—'} (${myBombs.length} active)`,
        `Craters    : ${craters.length > 0 ? craters.join(', ') : '—'}`,
        `Opp bombs  : hidden (${oppBombCount} placed)`,
    ].join('\n  ');

    console.log(lines.join('\n') + '\n  ' + summary + '\n');
};
