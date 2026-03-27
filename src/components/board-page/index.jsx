import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from "react-router-dom";

// styling
import './style.css';

// other components
import Chessboard from '../chessboard';
import SidePanel from '../side-panel';
import WinLossPopup from '../win-loss-popup';
import Timer from '../timer';
import ConfirmModal from '../confirm-modal';
import DetonationOverlay from '../detonation-overlay';
import MatchFoundOverlay from '../match-found-overlay';

// hooks
import {
    usePlayer,
    useOpponent,
    useIsMyTurn,
    useGameState,
    useGameFen,
    useMoveHistory,
    useUsername
} from '../../hooks';

// constant game states
import { GAME_STATES } from '../../constants';

// sockets use context so all components reference the same socket
import { useSocket, useBoardSocketHandlers } from "../../socket";
import { useDispatch } from 'react-redux';
import { actions } from '../../redux';

import { playSound, getFenAtIndex } from "../../utils";
import { sounds } from "../../assets";

const BoardPage = () => {
    const socket = useSocket();
    const dispatch = useDispatch();
    const myUsername = useUsername();
    const navigate = useNavigate();

    // information about the game being passed in
    const location = useLocation();
    const { roomId, players, fen, secsToPlaceBomb, secsToPlay } = location.state || {};

    // Set up game!
    useEffect(() => {
        if (roomId && players && fen) {
            const myInfo = (players[0].user_id === myUsername) ? players[0] : players[1];
            const opponentInfo = (players[1].user_id === myUsername) ? players[0] : players[1];

            // Show match found overlay briefly before bomb placement starts
            setShowMatchFound(true);
            setTimeout(() => setShowMatchFound(false), 2500);

            // make sure previous game state does not carry over
            dispatch(actions.resetGame());
            dispatch(actions.setGameState(GAME_STATES.placing_bombs));
            setStartingFen(fen);
            setViewIndex(null);
            setDrawOfferPending(false);
            setDrawOfferDeclinedMsg('');
            setDrawCooldown(0);
            setRematchOffered(false);
            setRematchRequested(false);
            setExplosionHistory([]);

            dispatch(actions.setOpponentInfo({
                name: opponentInfo.username,
                rating: opponentInfo.elo,
                bombs: [],
                secondsLeft: secsToPlay,
            }));

            dispatch(actions.setPlayerInfo({
                name: myInfo.username,
                rating: myInfo.elo,
                bombs: [],
                secondsLeft: secsToPlay,
            }));

            dispatch(actions.setGameFen(fen));
            dispatch(actions.setOrientation(myInfo.is_white));
            dispatch(actions.setPlacingBombSeconds(secsToPlaceBomb));
            playSound(sounds.gameStart);
        }
        // roomId, players, fen, secsToPlaceBomb, secsToPlay
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [players]);

    const player = usePlayer();
    const opponent = useOpponent();
    const gameState = useGameState();
    const gameFen = useGameFen();
    const moveHistory = useMoveHistory();

    const [viewIndex, setViewIndex] = useState(null); // null = "at latest"
    const [startingFen, setStartingFen] = useState(null);
    const prevViewIndexRef = useRef(null);
    const [snapFen, setSnapFen] = useState(null);
    const [boardAnimDuration, setBoardAnimDuration] = useState(undefined);
    const [explosionHistory, setExplosionHistory] = useState([]); // [{ square, moveCount }]
    const [disconnectCountdown, setDisconnectCountdown] = useState(null);
    const [displayWinLossPopup, setDisplayWinLossPopup] = useState(false);
    const [gameOverReason, setGameOverReason] = useState("");
    const [gameOverResult, setGameOverResult] = useState("");
    const [myEloChange, setmyEloChange] = useState(0);
    const [opponentEloChange, setOpponentEloChange] = useState(0);
    const [confirmAction, setConfirmAction] = useState(null); // null | 'resign' | 'draw'
    const [drawOfferPending, setDrawOfferPending] = useState(false);
    const [drawOfferDeclinedMsg, setDrawOfferDeclinedMsg] = useState('');
    const [drawCooldown, setDrawCooldown] = useState(0);
    const [rematchOffered, setRematchOffered] = useState(false);
    const [rematchRequested, setRematchRequested] = useState(false);
    const [detonatedPiece, setDetonatedPiece] = useState(null); // piece char or null
    const [showMatchFound, setShowMatchFound] = useState(false);

    // When the user jumps more than one move, snap to i-1 instantly then animate the single step to i
    useEffect(() => {
        const prev = prevViewIndexRef.current;
        prevViewIndexRef.current = viewIndex;

        if (viewIndex === null) {
            setSnapFen(null);
            setBoardAnimDuration(undefined);
            return;
        }

        const prevIdx = prev ?? moveHistory.length;
        if (Math.abs(viewIndex - prevIdx) > 1) {
            const snapIdx = Math.max(0, viewIndex - 1);
            setSnapFen(getFenAtIndex(startingFen ?? gameFen, moveHistory, snapIdx));
            setBoardAnimDuration(0);
            requestAnimationFrame(() => {
                setSnapFen(null);
                setBoardAnimDuration(undefined);
            });
        } else {
            setSnapFen(null);
            setBoardAnimDuration(undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewIndex]);

    // viewIndex === null means "at latest" — use live gameFen
    const isViewingHistory = viewIndex !== null && viewIndex < moveHistory.length;

    // Craters that should be visible at the current history position
    const visibleCraters = useMemo(() => {
        const currentCount = viewIndex ?? moveHistory.length;
        return explosionHistory
            .filter(e => e.moveCount <= currentCount)
            .map(e => e.square);
    }, [explosionHistory, viewIndex, moveHistory.length]);
    const displayFen = isViewingHistory
        ? getFenAtIndex(startingFen ?? gameFen, moveHistory, Math.max(0, viewIndex))
        : gameFen;

    // When any new move arrives, snap back to the live position
    useEffect(() => {
        setViewIndex(null);
    }, [moveHistory.length]);

    const goToStart = () => setViewIndex(0);
    const goBack = () => setViewIndex(v => {
        const current = v ?? moveHistory.length;
        return Math.max(0, current - 1);
    });
    const goForward = () => {
        setViewIndex(v => {
            const current = v ?? moveHistory.length;
            const next = current + 1;
            return next >= moveHistory.length ? null : next;
        });
    };
    const goToLatest = () => setViewIndex(null);
    const goToMove = (idx) => setViewIndex(idx);

    const handleResign = () => setConfirmAction('resign');
    const handleResignConfirm = () => {
        socket.emit('resign');
        setConfirmAction(null);
    };
    const handleOfferDraw = () => setConfirmAction('draw');
    const handleDrawConfirm = () => {
        socket.emit('offerDraw');
        setConfirmAction(null);
    };

    const handleRequestRematch = () => {
        socket.emit('requestRematch');
        setRematchRequested(true);
    };
    const handleNewGame = () => navigate('/');
    const onRematchReady = (newGameData) => {
        navigate('/play-game', { state: newGameData, replace: true });
    };

    const handleAcceptDraw = () => {
        socket.emit('drawResponse', { accepted: true });
        setDrawOfferPending(false);
    };
    const handleDeclineDraw = () => {
        socket.emit('drawResponse', { accepted: false });
        setDrawOfferPending(false);
    };

    // board socket handlers
    const {
        handleRoomCreated,
        handleRoomJoinError,
        handleDisconnect,
        handleStartPlay,
        handleGameState,
        handleinvalidMove,
        handleDrawGameOver,
        handleWinLossGameOver,
        handleSyncTime,
        handlePlayerRejoined,   // add this
        handleDrawOffer,
        handleDrawOfferDeclined,
        handleRematchOffered,
        handleRematchReady,
    } = useBoardSocketHandlers({
        setRoomMessage: (_x) => { }, // for now, we don't need it
        setGameOverReason,
        setGameOverResult,
        setmyEloChange,
        setOpponentEloChange,
        setDisplayWinLossPopup,
        setDisconnectCountdown,   // add this
        setDrawOfferPending,
        setDrawOfferDeclinedMsg,
        setRematchOffered,
        onRematchReady,
        onExplosion: (square, moveCount) => setExplosionHistory(prev => [...prev, { square, moveCount }]),
        onDetonation: (piece) => {
            setDetonatedPiece(piece);
            const isKing = piece?.toLowerCase() === 'k';
            setTimeout(() => setDetonatedPiece(null), isKing ? 3200 : 1600);
        },
    });

    useEffect(() => {
        socket.on('roomCreated', handleRoomCreated);
        socket.on('roomJoinError', handleRoomJoinError);
        socket.on('playerDisconnected', handleDisconnect);
        socket.on('startPlay', handleStartPlay);
        socket.on('gameState', handleGameState);
        socket.on('invalidMove', handleinvalidMove);
        socket.on('winLossGameOver', handleWinLossGameOver);
        socket.on('drawGameOver', handleDrawGameOver);
        socket.on('syncTime', handleSyncTime);
        socket.on('playerRejoined', handlePlayerRejoined);
        socket.on('drawOffer', handleDrawOffer);
        socket.on('drawOfferDeclined', handleDrawOfferDeclined);
        socket.on('rematchOffered', handleRematchOffered);
        socket.on('rematchReady', handleRematchReady);

        return () => {
            socket.off('roomCreated', handleRoomCreated);
            socket.off('roomJoinError', handleRoomJoinError);
            socket.off('playerDisconnected', handleDisconnect);
            socket.off('startPlay', handleStartPlay);
            socket.off('gameState', handleGameState);
            socket.off('invalidMove', handleinvalidMove);
            socket.off('winLossGameOver', handleWinLossGameOver);
            socket.off('drawGameOver', handleDrawGameOver);
            socket.off('syncTime', handleSyncTime);
            socket.off('playerRejoined', handlePlayerRejoined);
            socket.off('drawOffer', handleDrawOffer);
            socket.off('drawOfferDeclined', handleDrawOfferDeclined);
            socket.off('rematchOffered', handleRematchOffered);
            socket.off('rematchReady', handleRematchReady);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket]);

    useEffect(() => {
        if (disconnectCountdown === null || disconnectCountdown <= 0) return;
        const id = setTimeout(() => setDisconnectCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(id);
    }, [disconnectCountdown]);

    // Start 30s cooldown whenever our draw offer is declined
    useEffect(() => {
        if (drawOfferDeclinedMsg) setDrawCooldown(30);
    }, [drawOfferDeclinedMsg]);

    useEffect(() => {
        if (drawCooldown <= 0) return;
        const id = setTimeout(() => setDrawCooldown(prev => prev - 1), 1000);
        return () => clearTimeout(id);
    }, [drawCooldown]);

    const isMyMove = useIsMyTurn();

    // Critical timer: whole board reacts when the active player has ≤5 seconds
    const criticalTimer = gameState === GAME_STATES.playing && (
        (isMyMove && player.secondsLeft <= 5) ||
        (!isMyMove && opponent.secondsLeft <= 5)
    );

    // Derive player info for match found overlay
    const myInfo = players ? ((players[0].user_id === myUsername) ? players[0] : players[1]) : null;
    const opponentInfo = players ? ((players[1].user_id === myUsername) ? players[0] : players[1]) : null;

    if (!roomId) {
        return <p>Error: Missing game data</p>;
    }

    return (
        <div className={`board-page-container${gameState === GAME_STATES.placing_bombs ? ' placing-bombs' : ''}`}>
            {showMatchFound && myInfo && opponentInfo && (
                <MatchFoundOverlay
                    myName={myInfo.username}
                    myRating={myInfo.elo}
                    opponentName={opponentInfo.username}
                />
            )}
            <div className="game-container">
                <div className="game-content-wrapper">
                    {displayWinLossPopup && (
                        <WinLossPopup
                            result={gameOverResult}
                            reason={gameOverReason}
                            myEloChange={myEloChange}
                            opponentEloChange={opponentEloChange}
                            onClose={() => setDisplayWinLossPopup(false)}
                            onRequestRematch={handleRequestRematch}
                            onNewGame={handleNewGame}
                            rematchRequested={rematchRequested}
                        />
                    )}
                    {confirmAction && (
                        <ConfirmModal
                            message={confirmAction === 'resign'
                                ? 'Are you sure you want to resign?'
                                : 'Offer a draw to your opponent?'}
                            onConfirm={confirmAction === 'resign' ? handleResignConfirm : handleDrawConfirm}
                            onCancel={() => setConfirmAction(null)}
                        />
                    )}
                    {drawOfferPending && (
                        <ConfirmModal
                            message="Your opponent offers a draw. Accept?"
                            onConfirm={handleAcceptDraw}
                            onCancel={handleDeclineDraw}
                        />
                    )}
                    {drawOfferDeclinedMsg && (
                        <ConfirmModal
                            message={drawOfferDeclinedMsg}
                            confirmText="OK"
                            onConfirm={() => setDrawOfferDeclinedMsg('')}
                        />
                    )}
                    {rematchOffered && (
                        <ConfirmModal
                            message={`${opponent.name} would like a rematch. Accept?`}
                            onConfirm={() => { handleRequestRematch(); setRematchOffered(false); }}
                            onCancel={() => setRematchOffered(false)}
                        />
                    )}
                    <div className="chess-wrapper">
                        {disconnectCountdown !== null && disconnectCountdown > 0 && (
                            <div className="disconnect-notice">
                                Your opponent rage-quit. — {disconnectCountdown}s for their dignity to return.
                            </div>
                        )}
                        <div className={`player-info top${!isMyMove && gameState === GAME_STATES.playing ? ' active-turn' : ''}`}>
                            <span>{opponent.name}</span>
                            <span>{opponent.rating}</span>
                            <Timer
                                isActive={!isMyMove && gameState === GAME_STATES.playing}
                                serverSeconds={opponent.secondsLeft}
                                lastSyncAt={opponent.lastSyncAt}
                            />
                            <span>
                                {gameState === GAME_STATES.placing_bombs
                                    ? `💣x${3 - opponent.bombs.length}`
                                    : (
                                        <>
                                            {[...Array(3)].map((_, i) => (
                                                <span key={i}>
                                                    {i < opponent.bombs.length ? '💣' : '💥'}
                                                </span>
                                            ))}
                                        </>
                                    )
                                }
                            </span>
                        </div>

                        <div className={`chess-board-container${criticalTimer ? ' critical-timer' : ''}`}>
                            <Chessboard
                                key={roomId}
                                displayFen={snapFen ?? (isViewingHistory ? displayFen : undefined)}
                                animationDuration={boardAnimDuration}
                                visibleCraters={visibleCraters}
                            />
                            {detonatedPiece && <DetonationOverlay piece={detonatedPiece} />}
                        </div>

                        <div className={`player-info bottom${isMyMove && gameState === GAME_STATES.playing ? ' active-turn' : ''}`}>
                            <span>{player.name}</span>
                            <span>{player.rating}</span>
                            <Timer
                                isActive={isMyMove && gameState === GAME_STATES.playing}
                                serverSeconds={player.secondsLeft}
                                lastSyncAt={player.lastSyncAt}
                            />
                            <span>
                                {gameState === GAME_STATES.placing_bombs
                                    ? `💣x${3 - player.bombs.length}`
                                    : (
                                        <>
                                            {[...Array(3)].map((_, i) => (
                                                <span key={i}>
                                                    {i < player.bombs.length ? '💣' : '💥'}
                                                </span>
                                            ))}
                                        </>
                                    )
                                }
                            </span>
                        </div>
                    </div>
                    <SidePanel
                        viewIndex={viewIndex ?? moveHistory.length}
                        onGoToStart={goToStart}
                        onGoBack={goBack}
                        onGoForward={goForward}
                        onGoToLatest={goToLatest}
                        onGoToMove={goToMove}
                        onResign={gameState === GAME_STATES.playing ? handleResign : undefined}
                        onOfferDraw={gameState === GAME_STATES.playing ? handleOfferDraw : undefined}
                        drawCooldown={drawCooldown}
                        onRequestRematch={gameState === GAME_STATES.game_over ? handleRequestRematch : undefined}
                        onNewGame={gameState === GAME_STATES.game_over ? handleNewGame : undefined}
                        rematchRequested={rematchRequested}
                    />
                </div>
            </div>
        </div>

    );
};

export default BoardPage;
