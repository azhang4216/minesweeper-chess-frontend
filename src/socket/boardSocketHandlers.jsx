import { useDispatch } from 'react-redux';
import { useSocket } from "./";
import { images, sounds } from '../assets';
import { actions } from '../redux';
import { playSound } from '../utils';
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
}) => {

    const dispatch = useDispatch();                          // sends actions to redux store
    const socket = useSocket();                              // use context so that all components reference the same socket
    
    // useRef needed because the is white is updated after handlers connected,
    // so we need updated reference to isWhite
    const isWhite = useIsWhite();
    const isWhiteRef = useRef(isWhite);
    useEffect(() => {
        isWhiteRef.current = isWhite;
    }, [isWhite]);

    const handleRoomCreated = ({ message }) => {
        setRoomMessage(message);
        dispatch(actions.setGameState(GAME_STATES.matching));
    };

    const handleRoomJoined = ({ players, message, fen, secsToPlaceBomb, secsToPlay }) => {
        setRoomMessage(message);

        const myInfo = (players[0].user_id === socket.id) ? players[0] : players[1];
        const opponentInfo = (players[1].user_id === socket.id) ? players[0] : players[1];

        dispatch(actions.setOpponentInfo({
            name: opponentInfo.user_id,
            rating: 1500, // dummy placeholder for now
            bombs: [],
            secondsLeft: secsToPlay,
        }));

        dispatch(actions.setPlayerInfo({
            name: myInfo.user_id,
            rating: 1500, // dummy placeholder for now
            bombs: [],
            secondsLeft: secsToPlay,
        }));

        console.log(`In handle room joined, player is white? : ${myInfo.is_white}`);

        dispatch(actions.setGameState(GAME_STATES.placing_bombs));
        dispatch(actions.setGameFen(fen));
        dispatch(actions.setOrientation(myInfo.is_white));
        dispatch(actions.setPlacingBombSeconds(secsToPlaceBomb));
        playSound(sounds.gameStart);
    };

    const handleRoomJoinError = ({ message }) => {
        setRoomMessage(message);
        dispatch(actions.setGameState(GAME_STATES.inactive));
    };

    const handleDisconnect = ({ message }) => {
        console.log("disconnecting");
        setRoomMessage(message);
        dispatch(actions.reset());
        dispatch(actions.setGameState(GAME_STATES.inactive));
    };

    const handleStartPlay = ({ whitePlayerBombs, blackPlayerBombs }) => {
        if (whitePlayerBombs !== null && blackPlayerBombs !== null) {
            // we've received randomized bombs from timeout!
            setRoomMessage("Randomly placed bombs on timeout!");
            console.log(`Setting white player bombs: ${whitePlayerBombs}`);
            console.log(`Setting black player bombs: ${blackPlayerBombs}`);
            playSound(sounds.shovel);
            dispatch(actions.setRandomizedBombs({ whitePlayerBombs, blackPlayerBombs }));
        };

        console.log("Finished placing bombs. Now ready to play.");
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
                // temporary update is true, so the piece temporarily moves there
                dispatch(actions.updateGameFromServer(preExplosionFen, moveSan, true));

                const squareToExplode = specialMove.split(" ")[1];
                playSound(sounds.ohNoBoom);

                // if it is our own bomb, we need to remove the X
                dispatch(actions.detonateBomb(squareToExplode));

                setTimeout(() => {
                    // we get rid of the exploded piece a bit later for syncing with "oh no" sound
                    dispatch(actions.updateGameFromServer(gameFen, moveSan));

                    // explosion animation
                    const explosion = document.createElement('img');
                    explosion.src = images.explosionGif;
                    explosion.className = 'explosion';
                    explosion.style.position = 'absolute';
                    explosion.style.top = '0';
                    explosion.style.left = '0';
                    explosion.style.width = '100%';
                    explosion.style.height = '100%';
                    explosion.style.pointerEvents = 'none';
                    explosion.style.zIndex = '10';

                    const squareEl = document.querySelector(`[data-square="${squareToExplode}"]`);
                    squareEl.style.position = 'relative';
                    squareEl.appendChild(explosion);

                    // after animation, the scorched overlay is added
                    setTimeout(() => {
                        explosion.remove();

                        const crater = document.createElement('img');
                        crater.src = images.craterPng;
                        crater.className = 'scorched';
                        Object.assign(crater.style, {
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '85%',
                            height: '85%',
                            objectFit: 'cover',
                            pointerEvents: 'none',
                            zIndex: '1',
                            opacity: '0.9',
                            transform: 'translate(-50%, -50%)', // offset to center the crater
                        });

                        squareEl.appendChild(crater);
                    }, 1000);                                   // adjust time to match GIF length
                }, 900);                                        // delay time before we play explosion
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
        
        // if the reason the game ended is cuz a piece blew up leading to insufficient material, 
        // we delay the popup a little so that we can watch the piece blow up
        if (by.includes("explode")) {
            console.log(`explosive ending! waiting for animation`);
            setTimeout(() => {
                setDisplayWinLossPopup(true);
            }, 2000);
            playSound(sounds.gameEnd);
        } else {
            console.log(`regular ending! no need to wait for animation`);
            setDisplayWinLossPopup(true);
            playSound(sounds.gameEnd);
        };

        dispatch(actions.setGameState(GAME_STATES.game_over));
    };

    const handleWinLossGameOver = ({ winner, by, whiteEloChange, blackEloChange }) => {
        const isWinner = ((winner === 'w') && isWhiteRef.current) || ((winner === 'b') && !isWhiteRef.current);
        setGameOverResult(isWinner ? "You win" : "You lose");
        console.log(`Winner: ${winner}`);
        console.log(`Winner is white ? : ${winner === 'w'}`);
        console.log(`is white? : ${isWhiteRef.current}`);
        console.log(`set game over result: ${isWinner ? "You win" : "You lose"}`);
        setGameOverReason(by);
        setmyEloChange(isWhiteRef.current ? whiteEloChange : blackEloChange);
        setOpponentEloChange(isWhiteRef.current ? blackEloChange : whiteEloChange);

        // if the reason the game ended is cuz a king blew up, 
        // we delay the popup a little so that we can watch the king blow up
        if (by.includes("explode")) {
            setTimeout(() => {
                setDisplayWinLossPopup(true);
            }, 2000);
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

    return {
        handleRoomCreated,
        handleRoomJoined,
        handleRoomJoinError,
        handleDisconnect,
        handleStartPlay,
        handleGameState,
        handleinvalidMove,
        handleDrawGameOver,
        handleWinLossGameOver,
        handleSyncTime
    };
};

