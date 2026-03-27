import './style.css';

const PIECE_TEXTS = {
    Q: { line1: 'QUEEN HAS LEFT THE CHAT',   line2: 'She had the whole board. Chose poorly.' },
    q: { line1: 'QUEEN HAS LEFT THE CHAT',   line2: 'She had the whole board. Chose poorly.' },
    B: { line1: 'BISHOP.EXE CRASHED',        line2: 'The diocese is devastated.' },
    b: { line1: 'BISHOP.EXE CRASHED',        line2: 'The diocese is devastated.' },
    N: { line1: 'KNIGHT DOWN. NOT A DRILL.', line2: 'Horse go boom.' },
    n: { line1: 'KNIGHT DOWN. NOT A DRILL.', line2: 'Horse go boom.' },
    R: { line1: 'THE TOWER HAS FALLEN',      line2: 'As it was foretold.' },
    r: { line1: 'THE TOWER HAS FALLEN',      line2: 'As it was foretold.' },
    P: { line1: 'A pawn died doing its job.', line2: 'Nobody will remember.' },
    p: { line1: 'A pawn died doing its job.', line2: 'Nobody will remember.' },
    K: { line1: 'THE KING IS DEAD',          line2: 'Your Majesty has left the building.' },
    k: { line1: 'THE KING IS DEAD',          line2: 'Your Majesty has left the building.' },
};

const DetonationOverlay = ({ piece }) => {
    const isKing = piece?.toLowerCase() === 'k';
    const text = PIECE_TEXTS[piece] ?? { line1: 'PIECE DESTROYED', line2: '' };

    return (
        <div className={`det-overlay ${isKing ? 'det-overlay--king' : 'det-overlay--regular'}`}>
            <div className="det-ring det-ring--3" />
            <div className="det-ring det-ring--2" />
            <div className="det-ring det-ring--1" />
            <div className="det-content">
                <div className="det-emoji">{isKing ? '👑💥' : '💥'}</div>
                <div className="det-line1">{text.line1}</div>
                <div className="det-line2">{text.line2}</div>
            </div>
        </div>
    );
};

export default DetonationOverlay;
