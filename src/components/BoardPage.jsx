import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChessBoard from './ChessBoard';
import Loader from './Loader';
import SidePanel from './SidePanel';
import './BoardPage.css';
import { useSocket } from "../socketContext.js";
import * as actions from '../redux/actions.js';

// sound effects
import captureSound from '../assets/capture.mp3';
import castleSound from '../assets/castle.mp3';
import gameEndSound from '../assets/game-end.mp3';
import gameStartSound from '../assets/game-start.mp3';
import illegalSound from '../assets/illegal.mp3';
import moveCheckSound from '../assets/move-check.mp3';
import moveOpponentSound from '../assets/move-opponent.mp3';
import moveSelfSound from '../assets/move-self.mp3';
import ohNoBoomSound from '../assets/oh-no-boom.mov';
// import premoveSound from '../assets/premove.mp3';
import promoteSound from '../assets/promote.mp3';
// import tenSecondsSound from '../assets/tenseconds.mp3';

// other assets
import explosionGif from '../assets/explosion.gif';
import craterPng from '../assets/crater.png';

const BoardPage = () => {
    const dispatch = useDispatch();                          // sends actions to redux store
    const socket = useSocket();                              // use context so that all components reference the same socket

    const player = useSelector((state) => state.player);
    const opponent = useSelector((state) => state.opponent);

    const [roomId, setRoomId] = useState('');
    const [roomMessage, setRoomMessage] = useState('');
    const [gameState, setGameState] = useState("inactive");  // matching, or playing

    const playSound = (sound) => new Audio(sound).play();    // for playing sound effects

    useEffect(() => {
        const handleRoomCreated = ({ message }) => {
            setRoomMessage(message);
            setGameState("matching");
        };

        const handleRoomJoined = ({ players, message }) => {
            setRoomMessage(message);
            setGameState("playing");

            const myInfo = (players[0].user_id === socket.id) ? players[0] : players[1];
            const opponentInfo = (players[1].user_id === socket.id) ? players[0] : players[1];

            dispatch(actions.setOpponentInfo({
                name: opponentInfo.user_id,
                rating: 1500, // dummy placeholder for now
                bombs: []
            }));

            dispatch(actions.setPlayerInfo({
                name: myInfo.user_id,
                rating: 1500, // dummy placeholder for now
                bombs: []
            }));

            dispatch(actions.setOrientation(myInfo.is_white));
            dispatch(actions.setGameStage(true));

            playSound(gameStartSound);
        };

        const handleRoomJoinError = ({ message }) => {
            setRoomMessage(message);
            setGameState("inactive");
        };

        const handleDisconnect = ({ message }) => {
            console.log("disconnecting");
            setRoomMessage(message);
            setGameState("inactive");
        };

        const handleStartPlay = () => {
            console.log("Finished placing bombs. Now ready to play.");
            playSound(gameStartSound);
            dispatch(actions.setGameStage(false)); // boolean represents whether still placing bombs
        };

        const handleGameState = ({ gameFen, moveSan, specialMove, sideToMoveNext, preExplosionFen }) => {
            // determine who just made this move
            const isNextMoveWhite = !(sideToMoveNext === "b");
            const wasMyMove = player.isWhite !== isNextMoveWhite;

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
                    playSound(ohNoBoomSound);

                    // if it is our own bomb, we need to remove the X
                    dispatch(actions.detonateBomb(squareToExplode));

                    setTimeout(() => {
                        // we get rid of the exploded piece a bit later for syncing with "oh no" sound
                        dispatch(actions.updateGameFromServer(gameFen, moveSan));
                        
                        // explosion animation
                        const explosion = document.createElement('img');
                        explosion.src = explosionGif;
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
                            crater.src = craterPng;
                            crater.className = 'scorched';
                            Object.assign(crater.style, {
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '85%',
                                height: '85%',
                                objectFit: 'cover',
                                pointerEvents: 'none',
                                zIndex: '5',
                                opacity: '0.9',
                                transform: 'translate(-50%, -50%)', // offset to center the crater
                            });

                            squareEl.appendChild(crater);
                        }, 1000);                                   // adjust time to match GIF length
                    }, 900);                                        // delay time before we play explosion

                    // if we've just blown up the king, then game over!
                    // TODO

                } else {
                    switch (specialMove) {
                        case "capture":
                            playSound(captureSound);
                            break;
                        case "castle":
                            playSound(castleSound);
                            break;
                        case "promotion":
                            playSound(promoteSound);
                            break;
                        case "checkmate":
                        case "stalemate":
                        case "draw":
                        case "draw by 50-move rule":
                        case "threefold repetition":
                        case "insufficient material":
                            playSound(gameEndSound);
                            break;
                        case "in check":
                            playSound(moveCheckSound);
                            break;
                        default:
                            playSound(wasMyMove ? moveSelfSound : moveOpponentSound);
                            break;
                    }
                }
            } else {
                // Play default move sound for regular moves
                playSound(wasMyMove ? moveSelfSound : moveOpponentSound);
            }

        }

        const handleinvalidMove = () => {
            playSound(illegalSound);
        }

        socket.on('roomCreated', handleRoomCreated);
        socket.on('roomJoined', handleRoomJoined);
        socket.on('roomJoinError', handleRoomJoinError);
        socket.on('playerDisconnected', handleDisconnect);
        socket.on('startPlay', handleStartPlay);
        socket.on('gameState', handleGameState);
        socket.on('invalidMove', handleinvalidMove);

        return () => {
            socket.off('roomCreated', handleRoomCreated);
            socket.off('roomJoined', handleRoomJoined);
            socket.off('roomJoinError', handleRoomJoinError);
            socket.off('playerDisconnected', handleDisconnect);
            socket.off('startPlay', handleStartPlay);
            socket.off('gameState', handleGameState);
            socket.off('invalidMove', handleinvalidMove);
        };
    }, [dispatch, socket, player.isWhite]);

    const handleRoomIdChange = (event) => {
        setRoomId(event.target.value);
    };

    const handleJoinRoom = () => {
        if (!roomId) return;

        console.log(`Trying to join room ${roomId}`);
        socket.emit('joinRoom', roomId);
    };

    return (
        <div className="game-container">
            {gameState !== "playing" ? (
                <div className="chess-wrapper">
                    <div className="join-room-container">
                        <input
                            type="text"
                            value={roomId}
                            onChange={handleRoomIdChange}
                            placeholder="Enter Room ID"
                        />
                        <button onClick={handleJoinRoom}>Join Room</button>
                        {roomMessage && <p>{roomMessage}</p>}
                        {gameState === "matching" && <Loader />}
                    </div>
                </div>
            ) : (
                <div className="game-content-wrapper">
                    <div className="chess-wrapper">
                        <div className="player-info top">
                            <span>{opponent.name}</span>
                            <span>{opponent.rating}</span>
                            <span>💣 x{3 - opponent.bombs.length}</span>
                        </div>

                        <div className="chess-board-container">
                            <ChessBoard />
                        </div>

                        <div className="player-info bottom">
                            <span>{player.name}</span>
                            <span>{player.rating}</span>
                            <span>💣 x{3 - player.bombs.length}</span>
                        </div>
                    </div>
                    <SidePanel />
                </div>
            )}
        </div>

    );
};

export default BoardPage;
