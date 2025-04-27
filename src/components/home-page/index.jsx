import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './style.css';

import { Loader } from '../';
import { GAME_STATES } from '../../constants';

import { useSocket } from "../../socket";
import { useGameState } from "../../hooks";
import * as actions from '../../redux/actions.js';

import { sounds } from '../../assets';
import { playSound } from '../../utils';

const HomePage = () => {
    const socket = useSocket();
    const dispatch = useDispatch();
    // const navigate = useNavigate();
    const gameState = useGameState();

    const [roomId, setRoomId] = useState('');

    const handleRoomIdChange = (event) => {
        setRoomId(event.target.value);
    };

    const handleJoinRoom = () => {
        if (!roomId) return;

        console.log(`Trying to join room ${roomId}`);
        dispatch(actions.setGameState(GAME_STATES.matching));
        socket.emit('joinRoom', roomId);
    };

    const handleRoomJoined = ({ players, message, fen, secsToPlaceBomb, secsToPlay }) => {
        // setRoomMessage(message);

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

    useEffect(() => {
            socket.on('roomJoined', handleRoomJoined);
    
            return () => {
                socket.off('roomJoined', handleRoomJoined);
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [socket]);

    // useEffect(() => {
    //     if (gameState === GAME_STATES.playing) {
    //         navigate('/play-game');
    //     }
    // }, [gameState, navigate]);

    return (
        <div className="front-page">
            <div className="title">Minesweeper Chess</div>
            <div className="chess-wrapper">
                <div className="join-room-container">
                    <input
                        type="text"
                        value={roomId}
                        onChange={handleRoomIdChange}
                        placeholder="Enter Room ID"
                        className="room-input"
                    />
                    <button onClick={handleJoinRoom} disabled={gameState === GAME_STATES.matching}>
                        {gameState === GAME_STATES.matching ? "Matching..." : "Join Room"}
                    </button>
                    {gameState === GAME_STATES.matching && (
                        <>
                            <p className="room-message">Waiting for an opponent to join...</p>
                            <Loader />
                        </>
                    )}
                </div>
            </div>

            {/* Bomb animation elements */}
            <div className="bomb" />
            <div className="bomb" />
            <div className="bomb" />
            <div className="bomb" />
        </div>
    );
};

export default HomePage;
