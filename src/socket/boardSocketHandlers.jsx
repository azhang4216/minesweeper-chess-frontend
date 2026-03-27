import { useDispatch, useSelector } from 'react-redux';
import { sounds } from '../assets';
import { actions } from '../redux';
import { playSound, getPieceAtSquare } from '../utils';
import { useIsWhite } from '../hooks';
import { GAME_STATES } from '../constants';
import { useRef, useEffect } from 'react';

export const useBoardSocketHandlers = ({
    setRoomMessage,
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
    onRematchDeclined,     // called when opponent declines; replaces string-matched setRoomMessage
    onRematchReady,
    onExplosion,
    onDetonation,
}) => {

    const dispatch = useDispatch();                          // sends actions to redux store

    // useRef needed because the is white is updated after handlers connected,
    // so we need updated reference to isWhite
    const isWhite = useIsWhite();
    const isWhiteRef = useRef(isWhite);
    useEffect(() => {
        isWhiteRef.current = isWhite;
    }, [isWhite]);

    // Track move history length so we know which history index an explosion falls on
    const moveHistory = useSelector(state => state.game.moveHistory);
    const moveHistoryLengthRef = useRef(moveHistory.length);
    useEffect(() => {
        moveHistoryLengthRef.current = moveHistory.length;
    }, [moveHistory]);

    // Track whether the most recent explosion was a king (affects win/loss popup delay)
    const lastExplosionWasKingRef = useRef(false);

    const handleRoomCreated = ({ message }) => {
        setRoomMessage(message);
        dispatch(actions.setGameState(GAME_STATES.matching));
    };

    const handleRoomJoinError = ({ message }) => {
        setRoomMessage(message);
        dispatch(actions.setGameState(GAME_STATES.inactive));
    };

    const handleDisconnect = ({ timeoutMs, message }) => {
        setRoomMessage(message);
        setDisconnectCountdown(Math.floor(timeoutMs / 1000));
    };

    const handlePlayerRejoined = () => {
        setDisconnectCountdown(null);
        setRoomMessage("");
    };

    const handleStartPlay = ({ whitePlayerBombs, blackPlayerBombs }) => {
        if (whitePlayerBombs !== null && blackPlayerBombs !== null) {
            // we've received randomized bombs from timeout!
            setRoomMessage("Randomly placed bombs on timeout!");
            playSound(sounds.shovel);
            dispatch(actions.setRandomizedBombs({ whitePlayerBombs, blackPlayerBombs }));
        };

        playSound(sounds.gameStart);

        // double check every highlighted square is removed
        document.querySelectorAll('div.highlighted').forEach(div => div.remove());

        dispatch(actions.setGameState(GAME_STATES.playing));
    };

    const handleGameState = ({ gameFen, moveSan, specialMove, sideToMoveNext, preExplosionFen }) => {
        // determine who just made this move
        const isNextMoveWhite = !(sideToMoveNext === "b");
        const wasMyMove = isWhiteRef.current !== isNextMoveWhite;

        // update the game normally when move isn't an explosion
        // note: explosions have custom timing / updates
        if (!specialMove || !specialMove.startsWith("explode ")) {
            dispatch(actions.updateGameFromServer(gameFen, moveSan));
        }

        // see what sort of sound we need to play based on the move just made
        if (specialMove) {
            if (specialMove.startsWith("explode ")) {
                const squareToExplode = specialMove.split(" ")[1];

                // Dispatch real gameFen immediately — Redux is always authoritative
                dispatch(actions.updateGameFromServer(gameFen, moveSan));
                dispatch(actions.detonateBomb(squareToExplode));

                const explosionMoveCount = moveHistoryLengthRef.current;
                playSound(sounds.ohNoBoom);

                // Identify piece from preExplosionFen (preExplosionFen is not dispatched to Redux)
                const detonatedPiece = getPieceAtSquare(preExplosionFen, squareToExplode);
                const isKing = detonatedPiece?.toLowerCase() === 'k';
                lastExplosionWasKingRef.current = isKing;

                // Show cinematic overlay immediately while board shows correct (post-explosion) position
                onDetonation(detonatedPiece);

                // Record crater after delay (overlay still visible at this point)
                setTimeout(() => {
                    onExplosion(squareToExplode, explosionMoveCount);
                }, 900);
            } else {
                switch (specialMove) {
                    case "capture":
                        playSound(sounds.capture);
                        break;
                    case "castle":
                        playSound(sounds.castle);
                        break;
                    case "promotion":
                        playSound(sounds.promote);
                        break;
                    case "checkmate":
                    case "stalemate":
                    case "draw":
                    case "draw by 50-move rule":
                    case "threefold repetition":
                    case "insufficient material":
                        playSound(sounds.gameEnd);
                        break;
                    case "in check":
                        playSound(sounds.moveCheck);
                        break;
                    default:
                        playSound(wasMyMove ? sounds.moveSelf : sounds.moveOpponent);
                        break;
                }
            }
        } else {
            // Play default move sound for regular moves
            playSound(wasMyMove ? sounds.moveSelf : sounds.moveOpponent);
        }

    };

    const handleinvalidMove = () => {
        playSound(sounds.illegal);
    };

    const handleDrawGameOver = ({ by, whiteEloChange, blackEloChange }) => {
        setGameOverResult("Draw");
        setGameOverReason(by);
        setmyEloChange(isWhiteRef.current ? whiteEloChange : blackEloChange);
        setOpponentEloChange(isWhiteRef.current ? blackEloChange : whiteEloChange);
        
        // Delay the popup so the detonation overlay finishes before it appears.
        // Use the same timing as handleWinLossGameOver so king/non-king delays stay in sync.
        if (by.includes("explode")) {
            const delay = lastExplosionWasKingRef.current ? 5500 : 3200;
            setTimeout(() => setDisplayWinLossPopup(true), delay);
            playSound(sounds.gameEnd);
        } else {
            setDisplayWinLossPopup(true);
            playSound(sounds.gameEnd);
        };

        dispatch(actions.setGameState(GAME_STATES.game_over));
    };

    const handleWinLossGameOver = ({ winner, by, whiteEloChange, blackEloChange }) => {
        const isWinner = ((winner === 'w') && isWhiteRef.current) || ((winner === 'b') && !isWhiteRef.current);
        setGameOverResult(isWinner ? "You win" : "You lose");
        setGameOverReason(by);
        setmyEloChange(isWhiteRef.current ? whiteEloChange : blackEloChange);
        setOpponentEloChange(isWhiteRef.current ? blackEloChange : whiteEloChange);

        // King detonation: wait for the cinematic before showing game over.
        // Regular explosions that end games use a shorter delay.
        if (by.includes("explode")) {
            const delay = lastExplosionWasKingRef.current ? 5500 : 3200;
            setTimeout(() => setDisplayWinLossPopup(true), delay);
            playSound(sounds.gameEnd);
        } else {
            setDisplayWinLossPopup(true);
            playSound(sounds.gameEnd);
        };

        dispatch(actions.setGameState(GAME_STATES.game_over));
    };

    const handleSyncTime = ({ whiteTimeLeft, blackTimeLeft }) => {
        dispatch(actions.setTimers({ whiteTimeLeft, blackTimeLeft }));
    };

    const handleDrawOffer = () => {
        setDrawOfferPending(true);
    };

    const handleDrawOfferDeclined = () => {
        setDrawOfferDeclinedMsg('They declined. Cowards.');
    };

    const handleRematchOffered = () => setRematchOffered(true);

    const handleRematchDeclined = () => {
        setRematchRequested(false);
        onRematchDeclined();
    };

    const handleRematchReady = (gameData) => onRematchReady(gameData);

    return {
        handleRoomCreated,
        handleRoomJoinError,
        handleDisconnect,
        handleStartPlay,
        handleGameState,
        handleinvalidMove,
        handleDrawGameOver,
        handleWinLossGameOver,
        handleSyncTime,
        handlePlayerRejoined,
        handleDrawOffer,
        handleDrawOfferDeclined,
        handleRematchOffered,
        handleRematchDeclined,   // NEW
        handleRematchReady,
    };
};

