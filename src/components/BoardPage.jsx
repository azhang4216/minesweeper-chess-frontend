import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChessBoard from './ChessBoard';
import Loader from './Loader';
import './BoardPage.css';
import { useSocket } from "../socketContext.js";
import * as actions from '../redux/actions.js';

const MoveHistory = () => {
    const moveHistory = useSelector((state) => state.moveHistory);

    return (
        <div className="move-history">
            <h3>Moves</h3>
            {moveHistory.map((move, i) => (
                <div key={i}>
                    {String.fromCharCode(97 + move.from.col)}{8 - move.from.row} →{' '}
                    {String.fromCharCode(97 + move.to.col)}{8 - move.to.row}
                    {move.bombDetonated && ' 💣'}
                </div>
            ))}
        </div>
    );
};

const BoardPage = () => {
    const dispatch = useDispatch();      // sends actions to redux store
    const socket = useSocket();          // use context so that all components reference the same socket

    const player = useSelector((state) => state.player);
    const opponent = useSelector((state) => state.opponent);

    const [roomId, setRoomId] = useState('');
    const [roomMessage, setRoomMessage] = useState('');
    const [gameState, setGameState] = useState("inactive");  // matching, or playing

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

        socket.on('roomCreated', handleRoomCreated);
        socket.on('roomJoined', handleRoomJoined);
        socket.on('roomJoinError', handleRoomJoinError);
        socket.on('playerDisconnected', handleDisconnect);

        return () => {
            socket.off('roomCreated', handleRoomCreated);
            socket.off('roomJoined', handleRoomJoined);
            socket.off('roomJoinError', handleRoomJoinError);
            socket.on('playerDisconnected', handleDisconnect);
        };
    }, [dispatch, socket]);

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
            <div className="chess-wrapper">
                {gameState !== "playing" ? (
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
                ) : (
                    <>
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
                    </>
                )}
            </div>
            {gameState === "playing" && <MoveHistory />}
        </div>
    );
};

export default BoardPage;
