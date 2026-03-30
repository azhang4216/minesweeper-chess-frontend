import React, { useState } from "react";
import { Link } from "react-router-dom";
import './style.css';
import { getEloChangeColor } from "../../utils";
import { usePlayer, useOpponent, useUsername } from '../../hooks';
import { images } from '../../assets';
import { sendFriendRequest } from "../../api/profile";

const VARIANT_GIF = {
    win:  images.happyCatGif,
    loss: images.sadHamsterGif,
    draw: images.officeHandshakeMeme,
};

const getCopy = (variant, reason) => {
    const isExplosion = reason?.startsWith('explode');

    if (variant === 'win') {
        if (isExplosion) return {
            headline: 'VICTORY',
            tagline: 'They stepped on your mine.',
            subtext: 'They never saw it coming.',
        };
        if (reason === 'checkmate') return {
            headline: 'VICTORY',
            tagline: 'Clean. Calculated. Deadly.',
            subtext: 'No escape for the king.',
        };
        if (reason === 'timeout') return {
            headline: 'VICTORY',
            tagline: "Time ran out for them.",
            subtext: 'Patience is a weapon too.',
        };
        if (reason === 'resign') return {
            headline: 'VICTORY',
            tagline: 'They surrendered.',
            subtext: 'A wise opponent knows when to fold.',
        };
        return {
            headline: 'VICTORY',
            tagline: 'Well played.',
            subtext: 'Your mines were better placed.',
        };
    }

    if (variant === 'loss') {
        if (isExplosion) return {
            headline: 'DEFEAT',
            tagline: 'You stepped on a mine.',
            subtext: "Should've looked where you were going.",
        };
        if (reason === 'checkmate') return {
            headline: 'DEFEAT',
            tagline: 'Their pieces were better.',
            subtext: 'Touch grass and try again.',
        };
        if (reason === 'timeout') return {
            headline: 'DEFEAT',
            tagline: 'Your clock ran out.',
            subtext: 'Tick tock.',
        };
        if (reason === 'resign') return {
            headline: 'DEFEAT',
            tagline: 'You resigned.',
            subtext: 'Sometimes discretion is the better part of valor.',
        };
        return {
            headline: 'DEFEAT',
            tagline: 'Their mines were better placed.',
            subtext: 'Touch grass and try again.',
        };
    }

    // draw
    if (reason === 'stalemate') return {
        headline: 'DRAW',
        tagline: 'Stalemate.',
        subtext: 'No legal moves. A fitting end.',
    };
    if (reason === 'draw by 50-move rule') return {
        headline: 'DRAW',
        tagline: '50 moves, no progress.',
        subtext: 'The game gave up on you both.',
    };
    if (reason === 'threefold repetition') return {
        headline: 'DRAW',
        tagline: 'Déjà vu.',
        subtext: "Same position, three times. Neither of you dared change it.",
    };
    if (reason === 'insufficient material') return {
        headline: 'DRAW',
        tagline: "It's so over.",
        subtext: "Neither side has the firepower to finish.",
    };
    return {
        headline: 'DRAW',
        tagline: "A gentleman's agreement...",
        subtext: '...to be mediocre together.',
    };
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
    rematchDeclinedMsg,
}) => {
    const player = usePlayer();
    const opponent = useOpponent();
    const myUsername = useUsername();
    const [friendRequestSent, setFriendRequestSent] = useState(false);

    const canSendFriendRequest = myUsername && !opponent.is_guest;

    const handleSendFriendRequest = async () => {
        try {
            await sendFriendRequest(opponent.name, myUsername);
            setFriendRequestSent(true);
        } catch {
            setFriendRequestSent(true); // show "Sent" even on error (e.g. already friends)
        }
    };

    const isWin = result === 'You win';
    const isDraw = result === 'Draw';
    const variant = isWin ? 'win' : isDraw ? 'draw' : 'loss';
    const copy = getCopy(variant, reason);
    const safeEloChange = myEloChange ?? 0;
    const newElo = player.rating + safeEloChange;
    const eloColor = getEloChangeColor(safeEloChange);

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
                        {safeEloChange > 0 ? '+' : ''}{safeEloChange}
                    </span>
                    <span className="wl-elo-new">→ {newElo}</span>
                    <span className="wl-elo-label">ELO</span>
                </div>

                <div className="wl-matchup">
                    <span>{player.name}</span>
                    <span className="wl-matchup-vs">vs</span>
                    {opponent.is_guest
                        ? <span>{opponent.name}</span>
                        : <Link to={`/profile/${opponent.name}`} className="wl-opponent-link" onClick={onClose}>{opponent.name}</Link>
                    }
                </div>

                <div className="wl-actions">
                    {onRequestRematch && (
                        <button
                            className={`wl-btn wl-btn--primary${rematchRequested ? ' wl-btn--waiting' : ''}`}
                            onClick={!rematchDeclinedMsg ? onRequestRematch : undefined}
                            disabled={rematchRequested || !!rematchDeclinedMsg}
                        >
                            {rematchDeclinedMsg ? rematchDeclinedMsg : rematchRequested ? 'Waiting...' : 'Rematch'}
                        </button>
                    )}
                    {canSendFriendRequest && (
                        <button
                            className="wl-btn wl-btn--ghost"
                            onClick={handleSendFriendRequest}
                            disabled={friendRequestSent}
                        >
                            {friendRequestSent ? 'Request Sent' : 'Add Friend'}
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
