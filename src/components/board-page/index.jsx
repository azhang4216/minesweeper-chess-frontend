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
    useUsername,
    useIsWhite
} from '../../hooks';

// constant game states
import { GAME_STATES } from '../../constants';

// sockets use context so all components reference the same socket
import { useSocket, useBoardSocketHandlers } from "../../socket";
import { useDispatch } from 'react-redux';
import { actions } from '../../redux';

import { playSound, getFenAtIndex, getCapturedPieces, dbg, dbgBoard } from "../../utils";
import { pieces as pieceImages } from "../../assets";
import { sounds } from "../../assets";

const PIECE_SORT_ORDER = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };

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
            setRematchDeclinedMsg('');
            setExplosionHistory([]);
            setExplosionKey(0);
            detonationQueueRef.current = [];
            isDetonatingRef.current = false;

            dispatch(actions.setOpponentInfo({
                name: opponentInfo.username,
                rating: opponentInfo.elo,
                bombs: [],
                secondsLeft: secsToPlay,
                is_guest: opponentInfo.is_guest ?? false,
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
    const isWhite = useIsWhite();

    const [viewIndex, setViewIndex] = useState(null); // null = "at latest"
    // On rejoin, location.state only has roomId (no players/fen). Pre-seed the standard
    // opening FEN so the history viewer can replay moves from the correct starting position.
    const isRejoin = !!(roomId && !players);
    const [startingFen, setStartingFen] = useState(() =>
        isRejoin ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : null
    );
    const prevViewIndexRef = useRef(null);
    const [snapFen, setSnapFen] = useState(null);
    const [boardAnimDuration, setBoardAnimDuration] = useState(undefined);
    const [explosionKey, setExplosionKey] = useState(0);
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
    const [rematchDeclinedMsg, setRematchDeclinedMsg] = useState('');
    const [detonatedPiece, setDetonatedPiece] = useState(null); // piece char or null
    const [boardShaking, setBoardShaking] = useState(false);
    const [showMatchFound, setShowMatchFound] = useState(false);
    const [boardArmed, setBoardArmed] = useState(false);
    const [clickToMove, setClickToMove] = useState(false);
    const detonationQueueRef = useRef([]);
    const prevGameStateRef = useRef(gameState);
    const isDetonatingRef = useRef(false);

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

    // Captured pieces — updates as history is navigated
    const captured = useMemo(() => getCapturedPieces(displayFen), [displayFen]);
    // My row (bottom): pieces I captured from the opponent
    const myPiecesRow = (isWhite ? captured.capturedByWhite : captured.capturedByBlack)
        .filter(t => t !== 'k')
        .sort((a, b) => PIECE_SORT_ORDER[a] - PIECE_SORT_ORDER[b]);
    // Their row (top): pieces the opponent captured from me
    const theirPiecesRow = (isWhite ? captured.capturedByBlack : captured.capturedByWhite)
        .filter(t => t !== 'k')
        .sort((a, b) => PIECE_SORT_ORDER[a] - PIECE_SORT_ORDER[b]);
    // Piece image key prefix: pieces I captured are the opponent's color
    const myPieceColor = isWhite ? 'b' : 'w';
    const theirPieceColor = isWhite ? 'w' : 'b';
    const myMaterialAdv = isWhite ? Math.max(0, captured.materialAdv) : Math.max(0, -captured.materialAdv);
    const theirMaterialAdv = isWhite ? Math.max(0, -captured.materialAdv) : Math.max(0, captured.materialAdv);

    // Determine if a bomb square belongs to the current player based on orientation + rank.
    // White places on ranks 3-4, black on ranks 5-6 (enforced by server).
    const isPlayerBombSquare = (square) => {
        const rank = square[1];
        return isWhite ? (rank === '3' || rank === '4') : (rank === '5' || rank === '6');
    };

    // Full initial bomb lists (current unexploded + those that have since detonated)
    const allPlayerBombs = useMemo(() => {
        const explodedMine = explosionHistory.filter(e => isPlayerBombSquare(e.square)).map(e => e.square);
        return [...new Set([...player.bombs, ...explodedMine])];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player.bombs, explosionHistory, isWhite]);

    const allOpponentBombs = useMemo(() => {
        const explodedOpponent = explosionHistory.filter(e => !isPlayerBombSquare(e.square)).map(e => e.square);
        return [...new Set([...opponent.bombs, ...explodedOpponent])];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opponent.bombs, explosionHistory, isWhite]);

    // Compute which bombs were "active" (placed but not yet detonated) at a given move index.
    // This powers history navigation — bombs that exploded after viewIndex are still shown.
    const displayBombs = useMemo(() => {
        const isAtLatest = viewIndex === null;
        const isLivePlaying = (gameState === GAME_STATES.playing || gameState === GAME_STATES.placing_bombs) && isAtLatest;

        // During live play or bomb placement at the current position: let the chessboard use
        // redux-driven rendering (handles shovel sound, placement highlights, etc.).
        // During placement specifically, this ensures only the local player sees their own bombs.
        if (isLivePlaying) return null;

        const currentIdx = viewIndex ?? moveHistory.length;

        const activeMine = allPlayerBombs.filter(sq => {
            const exp = explosionHistory.find(e => e.square === sq);
            return !exp || exp.moveCount > currentIdx;
        });

        const activeOpponent = allOpponentBombs.filter(sq => {
            const exp = explosionHistory.find(e => e.square === sq);
            return !exp || exp.moveCount > currentIdx;
        });

        return [
            ...activeMine.map(sq => ({ square: sq, isOpponent: false })),
            ...activeOpponent.map(sq => ({ square: sq, isOpponent: true })),
        ];
    }, [viewIndex, moveHistory.length, gameState, allPlayerBombs, allOpponentBombs, explosionHistory]);

    // When any new move arrives, snap back to the live position
    useEffect(() => {
        setViewIndex(null);
    }, [moveHistory.length]);

    // "Board is armed" ceremony: detect the transition from placing_bombs -> playing
    useEffect(() => {
        if (prevGameStateRef.current === GAME_STATES.placing_bombs && gameState === GAME_STATES.playing) {
            setBoardArmed(true);
            setTimeout(() => setBoardArmed(false), 2200);
        }
        prevGameStateRef.current = gameState;
    }, [gameState]);

    // Debug: log bomb placements
    useEffect(() => {
        if (player.bombs.length === 0) return;
        dbg('bomb-placed', `My bombs: [${player.bombs.join(', ')}] (${player.bombs.length}/3)`);
    }, [player.bombs.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debug: log craters as they accumulate (each explosion adds one entry)
    useEffect(() => {
        if (explosionHistory.length === 0) return;
        const latest = explosionHistory[explosionHistory.length - 1];
        const allCraters = explosionHistory.map(e => e.square);
        dbg('explosion', `BOOM at ${latest.square} (move #${latest.moveCount})`);
        dbgBoard(gameFen, {
            myBombs: player.bombs,
            craters: allCraters,
            oppBombCount: opponent.bombs.length,
        });
    }, [explosionHistory.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setDisplayWinLossPopup(false);
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

    // Play detonation overlays sequentially so rapid double-explosions both animate
    const playNextDetonation = () => {
        if (detonationQueueRef.current.length === 0) {
            isDetonatingRef.current = false;
            // Restore default animation duration. No remount needed here —
            // currentPosition was already synced to the post-explosion FEN during
            // the initial explosion remount (animationDuration=0 made that update
            // immediate). A second remount only wipes crater/bomb markers.
            setBoardAnimDuration(undefined);
            return;
        }
        isDetonatingRef.current = true;
        const piece = detonationQueueRef.current.shift();
        setDetonatedPiece(piece);
        setBoardShaking(true);
        setTimeout(() => setBoardShaking(false), 700);
        const isKing = piece?.toLowerCase() === 'k';
        setTimeout(() => {
            setDetonatedPiece(null);
            playNextDetonation();
        }, isKing ? 5000 : 3000);
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
        handleRematchDeclined,
        handleRematchReady,
    } = useBoardSocketHandlers({
        setRoomMessage: () => {},
        setGameOverReason,
        setGameOverResult,
        setmyEloChange,
        setOpponentEloChange,
        setDisplayWinLossPopup,
        setDisconnectCountdown,
        setDrawOfferPending,
        setDrawOfferDeclinedMsg,
        setRematchOffered,
        setRematchRequested,
        onRematchDeclined: () => setRematchDeclinedMsg('Rematch declined.'),
        onRematchReady,
        onExplosion: (square, moveCount) => setExplosionHistory(prev => [...prev, { square, moveCount }]),
        onDetonation: (piece) => {
            // Force-remount the Chessboard so react-chessboard's internal currentPosition
            // initialises synchronously from the post-explosion gameFen. Without this,
            // currentPosition remains at the pre-explosion FEN until a setTimeout(fn,0)
            // fires; if the next move arrives before that timeout, the animation diff runs
            // against the stale position and the exploded piece visually reappears.
            setExplosionKey(k => k + 1);
            setBoardAnimDuration(0);
            detonationQueueRef.current.push(piece);
            if (!isDetonatingRef.current) playNextDetonation();
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
        socket.on('rematchDeclined', handleRematchDeclined);
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
            socket.off('rematchDeclined', handleRematchDeclined);
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
                            rematchDeclinedMsg={rematchDeclinedMsg}
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
                            onCancel={() => {
                                socket.emit('declineRematch');
                                setRematchOffered(false);
                                setRematchDeclinedMsg('You declined.');
                            }}
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
                            {opponent.is_guest ? (
                                <span className="guest-rating-wrap">
                                    {opponent.rating}?
                                    <span className="guest-rating-tooltip">
                                        This player is a guest. Their rating defaults to 1500 — what you see reflects ELO gained or lost this session only.
                                    </span>
                                </span>
                            ) : (
                                <span>{opponent.rating}</span>
                            )}
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

                        <div className="captured-row">
                            {theirPiecesRow.map((t, i) => (
                                <img key={i} src={pieceImages[theirPieceColor + t.toUpperCase()]} className="cap-piece" alt={t} />
                            ))}
                            {theirMaterialAdv > 0 && <span className="material-adv">+{theirMaterialAdv}</span>}
                        </div>

                        <div className={`chess-board-container${criticalTimer ? ' critical-timer' : ''}${boardShaking ? ' shaking' : ''}`}>
                            <Chessboard
                                key={`${roomId}-${explosionKey}`}
                                displayFen={snapFen ?? (isViewingHistory ? displayFen : undefined)}
                                animationDuration={boardAnimDuration}
                                visibleCraters={visibleCraters}
                                displayBombs={displayBombs}
                                clickToMove={clickToMove}
                            />
                            {detonatedPiece && <DetonationOverlay piece={detonatedPiece} />}
                            {gameState === GAME_STATES.placing_bombs && (
                                <div className="enemy-territory-fog">
                                    <span className="fog-main">Enemy Territory</span>
                                    <span className="fog-sub">Bombs being set in secret</span>
                                </div>
                            )}
                            {boardArmed && (
                                <div className="board-armed-overlay">
                                    <span className="armed-title">💣 The board is armed.</span>
                                    <span className="armed-subtitle">Tread carefully.</span>
                                </div>
                            )}
                        </div>

                        <div className="captured-row">
                            {myPiecesRow.map((t, i) => (
                                <img key={i} src={pieceImages[myPieceColor + t.toUpperCase()]} className="cap-piece" alt={t} />
                            ))}
                            {myMaterialAdv > 0 && <span className="material-adv">+{myMaterialAdv}</span>}
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
                        onRequestRematch={gameState === GAME_STATES.game_over && !displayWinLossPopup ? handleRequestRematch : undefined}
                        onNewGame={gameState === GAME_STATES.game_over && !displayWinLossPopup ? handleNewGame : undefined}
                        rematchRequested={rematchRequested}
                        rematchDeclinedMsg={rematchDeclinedMsg}
                        clickToMove={clickToMove}
                        onClickToMoveToggle={() => setClickToMove(v => !v)}
                    />
                </div>
            </div>
        </div>

    );
};

export default BoardPage;
