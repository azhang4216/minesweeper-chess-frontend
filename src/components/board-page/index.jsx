import { useState, useEffect } from 'react';
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

    // Set up game!
    useEffect(() => {
        if (roomId && players && fen) {
            const myInfo = (players[0].user_id === myUsername) ? players[0] : players[1];
            const opponentInfo = (players[1].user_id === myUsername) ? players[0] : players[1];
            console.log(`my info: ${myInfo}, opponent info: ${opponentInfo}`);

            // make sure previous game state does not carry over
            dispatch(actions.resetGame());

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

            console.log(`In handle room joined, player is white? : ${myInfo.is_white}`);

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

    if (!roomId) {
        return <p>Error: Missing game data</p>;
    }

    return (
        <div className="board-page-container">
            <img src="/landmine_purple.png" alt="Landmine Chess Logo" className="title-logo" />
            <div className="game-container">
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
            </div>
        </div>

    );
};

export default BoardPage;
