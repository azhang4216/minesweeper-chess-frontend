import React, { useEffect, useRef, useState } from 'react';
import './style.css';

// hooks
import {
    useIsWhite,
    useMoveHistory,
    useMyBombs,
    useBombPlantingTime,
    useGameState
} from '../../hooks';

// components
import { Timer } from '../';

// constants
import { GAME_STATES } from '../../constants';

const SidePanel = ({
    viewIndex,
    onGoToStart,
    onGoBack,
    onGoForward,
    onGoToLatest,
    onGoToMove,
    onResign,
    onOfferDraw,
    drawCooldown = 0,
    onRequestRematch,
    onNewGame,
    rematchRequested,
}) => {
    const moveHistory = useMoveHistory();
    const isWhite = useIsWhite();
    const myBombs = useMyBombs();
    const bombPlantingTimeLeft = useBombPlantingTime();
    const gameState = useGameState();

    // Track when bombPlantingTimeLeft was last set so the Timer can correct for elapsed time
    const [bombSyncAt, setBombSyncAt] = useState(() => Date.now());
    useEffect(() => {
        setBombSyncAt(Date.now());
    }, [bombPlantingTimeLeft]);

    const moveHistoryEndRef = useRef(null);
    useEffect(() => {
        if (viewIndex >= moveHistory.length) {
            moveHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [moveHistory, viewIndex]);

    return (
        <div className="side-panel">
            {(gameState === GAME_STATES.placing_bombs) ?
                <div className="bomb-placement-info">
                    <h3>
                        {
                            (myBombs.length < 3) ?
                                `Plant your ${3 - myBombs.length} bombs!` :
                                "Waiting for your opponent to finish planting bombs..."
                        }
                    </h3>
                    <Timer
                        isActive={true}
                        serverSeconds={bombPlantingTimeLeft}
                        lastSyncAt={bombSyncAt}
                    />
                    <p>
                        As the {isWhite ? "white" : "black"} player, you can place bombs only on the {isWhite ? "3rd & 4th" : "5th & 6th"} ranks.
                        <br />
                        <br />
                        Your opponent can't see them, but you can (marked with a red X).
                        <br />
                        <br />
                        Any piece that steps on a bomb is destroyed, and the bomb is removed.
                    </p>
                </div>
                :
                <div className="move-history">
                    <div className="move-history-header">
                        <span className="moves-label">Moves</span>
                        <div className="nav-controls">
                            <button className="nav-btn" onClick={onGoToStart} title="Start">⏮</button>
                            <button className="nav-btn" onClick={onGoBack} title="Previous">◀</button>
                            <button className="nav-btn" onClick={onGoForward} title="Next">▶</button>
                            <button className="nav-btn" onClick={onGoToLatest} title="Latest">⏭</button>
                        </div>
                    </div>
                    <div className="move-history-table">
                        {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, idx) => {
                            const whiteMoveIdx = 2 * idx + 1;
                            const blackMoveIdx = 2 * idx + 2;
                            return (
                                <div className="move-history-row" key={idx}>
                                    <div className="move-turn">{idx + 1}.</div>
                                    <div
                                        className={`move-white${viewIndex === whiteMoveIdx ? ' move-active' : ''}`}
                                        onClick={() => moveHistory[2 * idx] && onGoToMove(whiteMoveIdx)}
                                    >
                                        {moveHistory[2 * idx] || ''}
                                    </div>
                                    <div
                                        className={`move-black${viewIndex === blackMoveIdx ? ' move-active' : ''}`}
                                        onClick={() => moveHistory[2 * idx + 1] && onGoToMove(blackMoveIdx)}
                                    >
                                        {moveHistory[2 * idx + 1] || ''}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={moveHistoryEndRef} />
                    </div>
                </div>
            }
            {(onResign || onOfferDraw) && (
                <div className="game-actions">
                    {onResign && (
                        <button className="action-btn action-btn--danger" onClick={onResign}>
                            Resign
                        </button>
                    )}
                    {onOfferDraw && (
                        <button
                            className="action-btn action-btn--ghost"
                            onClick={onOfferDraw}
                            disabled={drawCooldown > 0}
                        >
                            {drawCooldown > 0 ? `Draw (${drawCooldown}s)` : 'Draw'}
                        </button>
                    )}
                </div>
            )}
            {(onRequestRematch || onNewGame) && (
                <div className="game-actions">
                    {onRequestRematch && (
                        <button
                            className={`action-btn action-btn--primary${rematchRequested ? ' action-btn--waiting' : ''}`}
                            onClick={onRequestRematch}
                            disabled={rematchRequested}
                        >
                            {rematchRequested ? 'Waiting...' : 'Rematch'}
                        </button>
                    )}
                    {onNewGame && (
                        <button className="action-btn action-btn--ghost" onClick={onNewGame}>
                            New Game
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SidePanel;