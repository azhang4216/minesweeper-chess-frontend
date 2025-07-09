import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";

// styling
import './style.css';

// other components
import Chessboard from '../chessboard';
import SidePanel from '../side-panel';
import WinLossPopup from '../win-loss-popup';
import Timer from '../timer';

// hooks
import {
    usePlayer,
    useOpponent,
    useIsMyTurn,
    useGameState,
    useMoveHistory,
    useUsername
} from '../../hooks';

// constant game states
import { GAME_STATES } from '../../constants';

// sockets use context so all components reference the same socket
import { useSocket, useBoardSocketHandlers } from "../../socket";
import { useDispatch } from 'react-redux';
import { actions } from '../../redux';

import { playSound } from "../../utils";
import { sounds } from "../../assets";

const BoardPage = () => {
    const socket = useSocket();
    const dispatch = useDispatch();
    const myUsername = useUsername();

    // information about the game being passed in
    const location = useLocation();
    const { roomId, players, fen, secsToPlaceBomb, secsToPlay } = location.state || {};
    console.log(`room id: ${roomId}; players: ${JSON.stringify(players)}, fen: ${fen}, secsToPlaceBomb: ${secsToPlaceBomb}, secsToPlay: ${secsToPlay}`);

    useEffect(() => {
        if (roomId && players && fen) {
            const myInfo = (players[0].user_id === myUsername) ? players[0] : players[1];
            const opponentInfo = (players[1].user_id === myUsername) ? players[0] : players[1];

            dispatch(actions.setOpponentInfo({
                name: opponentInfo.user_id,
                rating: opponentInfo.elo,
                bombs: [],
                secondsLeft: secsToPlay,
            }));

            dispatch(actions.setPlayerInfo({
                name: myInfo.user_id,
                rating: opponentInfo.elo,
                bombs: [],
                secondsLeft: secsToPlay,
            }));

            console.log(`In handle room joined, player is white? : ${myInfo.is_white}`);

            dispatch(actions.setGameFen(fen));
            dispatch(actions.setOrientation(myInfo.is_white));
            dispatch(actions.setPlacingBombSeconds(secsToPlaceBomb));
            playSound(sounds.gameStart);
        }
        // roomId, players, fen, secsToPlaceBomb, secsToPlay
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const player = usePlayer();
    const opponent = useOpponent();
    const gameState = useGameState();
    const moveHistory = useMoveHistory();

    // for timer display logic
    const isMyMove = useIsMyTurn();
    useEffect(() => { console.log(`it is my move: ${isMyMove}`) }, [isMyMove]);
    useEffect(() => { console.log(`Game state: ${gameState}`) }, [gameState]);

    // these are for the outcome at the end of the game
    const [displayWinLossPopup, setDisplayWinLossPopup] = useState(false);
    const [gameOverReason, setGameOverReason] = useState("");
    const [gameOverResult, setGameOverResult] = useState("");
    const [myEloChange, setmyEloChange] = useState(0);
    const [opponentEloChange, setOpponentEloChange] = useState(0);

    // board socket handlers
    const {
        handleRoomCreated,
        // _handleRoomJoined,
        handleRoomJoinError,
        handleDisconnect,
        handleStartPlay,
        handleGameState,
        handleinvalidMove,
        handleDrawGameOver,
        handleWinLossGameOver,
        handleSyncTime
    } = useBoardSocketHandlers({
        setRoomMessage: (_x) => { }, // for now, we don't need it
        setGameOverReason,
        setGameOverResult,
        setmyEloChange,
        setOpponentEloChange,
        setDisplayWinLossPopup
    });

    // const [madeCustomCursors, setMadeCustomCursors] = useState(false);

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

        return () => {
            socket.off('roomCreated', handleRoomCreated);
            // socket.off('roomJoined', handleRoomJoined);
            socket.off('roomJoinError', handleRoomJoinError);
            socket.off('playerDisconnected', handleDisconnect);
            socket.off('startPlay', handleStartPlay);
            socket.off('gameState', handleGameState);
            socket.off('invalidMove', handleinvalidMove);
            socket.off('winLossGameOver', handleWinLossGameOver);
            socket.off('drawGameOver', handleDrawGameOver);
            socket.off('syncTime', handleSyncTime);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket]);

    // this is for changing our cursor for planting bombs
    // const changeCursor = () => {
    //     console.log(`Placing bombs: ${placingBombs}`);
    //     console.log(`Made custom cursors: ${madeCustomCursors}`);
    //     if (placingBombs && !madeCustomCursors) {
    //         // we haven't set our custom cursors yet! 
    //         console.log("hello world!");

    //         // we can shovel up the 3rd and 4th ranks as white, and 5th and 6th ranks as black
    //         const squaresToChange = isWhite
    //             ? ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    //                 'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4']
    //             : ['a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    //                 'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6'];

    //         const canvas = document.createElement('canvas');
    //         canvas.width = 100;
    //         canvas.height = 150;
    //         const ctx = canvas.getContext('2d');

    //         // Set font and draw emoji
    //         ctx.font = '50px serif';
    //         ctx.textBaseline = 'top';
    //         ctx.fillText('🪏', 0, 0);

    //         // Convert to image data URL
    //         const dataURL = canvas.toDataURL('image/png');

    //         squaresToChange.forEach((square, _index) => {
    //             const squareEl = document.querySelector(`[data-square="${square}"]`);
    //             if (squareEl) {
    //                 // squareEl.style.cursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='48' viewBox='0 0 100 100' style='fill:black;font-size:55px;'><text y='50%'>🪏</text></svg>") 16 0, auto`;
    //                 squareEl.style.cursor = `url(${dataURL}) 32 32, auto`;
    //                 console.log(`Set ${square} cursor`);
    //             } else {
    //                 console.log(`Couldn't find square ${square}`);
    //             }
    //         });

    //         setMadeCustomCursors(true);
    //     } else if (!placingBombs && madeCustomCursors) {
    //         // get rid of custom cursors
    //         const squaresToRevert = isWhite
    //             ? ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    //                 'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4']
    //             : ['a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    //                 'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6'];

    //         squaresToRevert.forEach((square) => {
    //             const squareEl = document.querySelector(`[data-square="${square}"]`);
    //             if (squareEl) {
    //                 squareEl.style.removeProperty('cursor');
    //             }
    //         });
    //     }
    // };

    // const handleNavigateHome = () => {
    //     dispatch(actions.reset());
    //     socket.emit("playerDisconnect");
    // };

    if (!roomId) {
        return <p>Error: Missing game data</p>;
    }

    return (
        <div className="board-page-container">
            {/* <button
                onClick={handleNavigateHome}
                className="home-button"
            >
                Go Home
            </button> */}
            <div className="title">Landmine Chess</div>
            <div className="game-container">
                {/* {gameState === GAME_STATES.inactive || gameState === GAME_STATES.matching ? (
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
                        {gameState === GAME_STATES.matching && <Loader />}
                    </div>
                </div>
            ) : ( */}
                <div
                    className={gameState === GAME_STATES.placing_bombs ? "game-content-wrapper" : "game-content-wrapper"}
                >
                    {displayWinLossPopup && (
                        <WinLossPopup
                            result={gameOverResult}
                            reason={gameOverReason}
                            myEloChange={myEloChange}
                            opponentEloChange={opponentEloChange}
                            onClose={() => setDisplayWinLossPopup(false)}
                        />
                    )}
                    <div className="chess-wrapper">
                        <div className="player-info top">
                            <span>{opponent.name}</span>
                            <span>{opponent.rating}</span>
                            <Timer
                                isActive={!isMyMove && (gameState === GAME_STATES.playing) && moveHistory.length > 0}
                                initialSeconds={opponent.secondsLeft}
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

                        <div
                            className="chess-board-container"
                        >
                            <Chessboard />
                        </div>

                        <div className="player-info bottom">
                            <span>{player.name}</span>
                            <span>{player.rating}</span>
                            <Timer
                                isActive={isMyMove && (gameState === GAME_STATES.playing) && moveHistory.length > 0}
                                initialSeconds={player.secondsLeft}
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
                    <SidePanel />
                </div>
                {/* )} */}
            </div>
        </div>

    );
};

export default BoardPage;
