import React, { useState, useEffect } from 'react';

// styling
import './style.css';

// other components
import {
    Chessboard,
    Loader,
    SidePanel,
    WinLossPopup,
    Timer
} from '../';

// hooks
import {
    usePlayer,
    useOpponent,
    useIsMyTurn,
    useGameState
} from '../../hooks';

// constant game states
import { GAME_STATES } from '../../constants';

// sockets use context so all components reference the same socket
import { useSocket, useBoardSocketHandlers } from "../../socket";

const BoardPage = () => {
    const socket = useSocket();

    const player = usePlayer();
    const opponent = useOpponent();
    const gameState = useGameState();

    // for timer display logic
    const isMyMove = useIsMyTurn();
    useEffect(() => { console.log(`it is my move: ${isMyMove}`) }, [isMyMove]);
    useEffect(() => {console.log(`Game state: ${gameState}`)}, [gameState]);

    const [roomId, setRoomId] = useState('');
    const [roomMessage, setRoomMessage] = useState('');

    // these are for the outcome at the end of the game
    const [displayWinLossPopup, setDisplayWinLossPopup] = useState(false);
    const [gameOverReason, setGameOverReason] = useState("");
    const [gameOverResult, setGameOverResult] = useState("");
    const [myEloChange, setmyEloChange] = useState(0);
    const [opponentEloChange, setOpponentEloChange] = useState(0);

    // board socket handlers
    const {
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
    } = useBoardSocketHandlers({
        setRoomMessage,
        setGameOverReason,
        setGameOverResult,
        setmyEloChange,
        setOpponentEloChange,
        setDisplayWinLossPopup
    });

    // const [madeCustomCursors, setMadeCustomCursors] = useState(false);

    useEffect(() => {
        socket.on('roomCreated', handleRoomCreated);
        socket.on('roomJoined', handleRoomJoined);
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
            socket.off('roomJoined', handleRoomJoined);
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
            {gameState === GAME_STATES.inactive || gameState === GAME_STATES.matching ? (
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
            ) : (
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
                                isActive={!isMyMove && (gameState === GAME_STATES.playing)}
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
                                isActive={isMyMove && (gameState === GAME_STATES.playing)}
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
            )}
        </div>

    );
};

export default BoardPage;
