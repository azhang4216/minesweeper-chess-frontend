import React from "react";
import './style.css';
import { getEloChangeColor } from "../../utils";
import { usePlayer, useOpponent } from '../../hooks';
import { images } from '../../assets';

const VARIANT_GIF = {
    win:  images.happyCatGif,
    loss: images.sadHamsterGif,
    draw: images.catSadgeLoadingGif,
};

const COPY = {
    win: {
        headline: 'VICTORY',
        tagline: 'Clean. Calculated. Deadly.',
        subtext: 'Your mines were better placed.',
    },
    loss: {
        headline: 'DEFEAT',
        tagline: 'Their mines were better placed.',
        subtext: 'Touch grass and try again.',
    },
    draw: {
        headline: 'DRAW',
        tagline: 'A gentleman\'s agreement...',
        subtext: '...to be mediocre together.',
    },
};

const humanizeReason = (reason) => {
    if (!reason) return '';
    if (reason.startsWith('explode')) return 'mine detonation';
    const map = {
        checkmate: 'checkmate',
        timeout: 'timeout',
        resign: 'resignation',
        draw: 'mutual agreement',
        'draw by 50-move rule': '50-move rule',
        'threefold repetition': 'repetition',
        'insufficient material': 'insufficient material',
        stalemate: 'stalemate',
    };
    return map[reason] ?? reason;
};

const WinLossPopup = ({
    result,
    reason,
    myEloChange,
    opponentEloChange,
    onClose,
    onRequestRematch,
    onNewGame,
    rematchRequested,
}) => {
    const player = usePlayer();
    const opponent = useOpponent();

    const isWin = result === 'You win';
    const isDraw = result === 'Draw';
    const variant = isWin ? 'win' : isDraw ? 'draw' : 'loss';
    const copy = COPY[variant];
    const newElo = player.rating + myEloChange;
    const eloColor = getEloChangeColor(myEloChange);

    return (
        <div className={`wl-overlay wl-overlay--${variant}`}>
            <img src={VARIANT_GIF[variant]} alt="" className="wl-bg-gif" aria-hidden="true" />
            <div className="wl-card">
                <div className="wl-headline">{copy.headline}</div>
                <div className="wl-tagline">{copy.tagline}</div>
                <div className="wl-subtext">{copy.subtext}</div>

                <div className="wl-reason">
                    by {humanizeReason(reason)}
                </div>

                <div className="wl-elo">
                    <span className="wl-elo-change" style={{ color: eloColor }}>
                        {myEloChange > 0 ? '+' : ''}{myEloChange}
                    </span>
                    <span className="wl-elo-new">→ {newElo}</span>
                    <span className="wl-elo-label">ELO</span>
                </div>

                <div className="wl-matchup">
                    <span>{player.name}</span>
                    <span className="wl-matchup-vs">vs</span>
                    <span>{opponent.name}</span>
                </div>

                <div className="wl-actions">
                    {onRequestRematch && (
                        <button
                            className={`wl-btn wl-btn--primary${rematchRequested ? ' wl-btn--waiting' : ''}`}
                            onClick={onRequestRematch}
                            disabled={rematchRequested}
                        >
                            {rematchRequested ? 'Waiting...' : 'Rematch'}
                        </button>
                    )}
                    {onNewGame && (
                        <button className="wl-btn wl-btn--ghost" onClick={() => { onClose(); onNewGame(); }}>
                            New Game
                        </button>
                    )}
                    <button className="wl-btn wl-btn--ghost" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WinLossPopup;
