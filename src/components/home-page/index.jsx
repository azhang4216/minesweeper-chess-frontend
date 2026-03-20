import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_STATES } from '../../constants';
import { useGameState, useIsLoggedIn } from "../../hooks";
import { useDispatch } from 'react-redux';
import { actions } from "../../redux";
import { generateGuestUUID } from "../../api";
import { useSocket } from "../../socket";
import './style.css';

const TIME_CONTROLS = [
    { label: '1m',  seconds: 60 },
    { label: '3m',  seconds: 180 },
    { label: '5m',  seconds: 300 },
    { label: '10m', seconds: 600 },
];

const HomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const socket = useSocket();
    const gameState = useGameState();
    const isLoggedIn = useIsLoggedIn();

    const [selectedTimeControl, setSelectedTimeControl] = useState(180);
    const [searching, setSearching] = useState(false);
    const [queueError, setQueueError] = useState('');

    const handleSignIn = () => navigate("/sign-in");

    const handlePlayAsGuest = async () => {
        try {
            const assignedGuestID = await generateGuestUUID();
            dispatch(actions.playAsGuest(assignedGuestID));
            socket.emit("authenticate", { playerId: assignedGuestID });
        } catch (e) {
            console.error("Failed to generate guest UUID:", e);
        }
    };

    const handlePlayGame = () => {
        setQueueError('');
        socket.emit("enterQueue", { timeControl: selectedTimeControl }, (response) => {
            if (response?.success) {
                setSearching(true);
            } else {
                setQueueError(response?.message || "Failed to join queue. Please try again.");
            }
        });
    };

    const handleCancel = () => {
        setSearching(false);
        socket.emit("leaveQueue");
    };

    // Listen for roomJoined — fires when the backend finds a match
    useEffect(() => {
        const handleRoomJoined = (data) => {
            setSearching(false);
            dispatch(actions.setGameState(GAME_STATES.placing_bombs));
            navigate("/play-game", { state: data });
        };

        socket.on("roomJoined", handleRoomJoined);
        return () => socket.off("roomJoined", handleRoomJoined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // If the socket disconnects while searching, close the popup.
    // The backend automatically removes the player from the queue on disconnect,
    // so the user must click Play Game again after reconnecting.
    useEffect(() => {
        const handleDisconnect = () => setSearching(false);
        socket.on("disconnect", handleDisconnect);
        return () => socket.off("disconnect", handleDisconnect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ButtonGroups = () => {
        if (isLoggedIn) {
            return (
                <div className="matchmaking-group">
                    <div className="time-control-pills">
                        {TIME_CONTROLS.map(({ label, seconds }) => (
                            <button
                                key={seconds}
                                className={`time-control-pill${selectedTimeControl === seconds ? ' time-control-pill--active' : ''}`}
                                onClick={() => setSelectedTimeControl(seconds)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {queueError && <p className="queue-error">{queueError}</p>}
                    <button
                        className="play-game-button"
                        onClick={handlePlayGame}
                        disabled={gameState === GAME_STATES.playing}
                    >
                        Play Game
                    </button>
                </div>
            );
        }
        return (
            <div className="button-group">
                <button onClick={handleSignIn} className="sign-in-button">
                    Sign In
                </button>
                <button onClick={handlePlayAsGuest} className="guest-button">
                    Play as Guest
                </button>
            </div>
        );
    };

    return (
        <div className="front-page">
            <img src="/landmine_white.png" alt="Landmine Chess Logo" className="logo" />
            <div className="join-create-room-container">
                {ButtonGroups()}
            </div>

            {searching && (
                <div className="searching-overlay">
                    <div className="searching-popup">
                        <div className="searching-spinner" />
                        <p className="searching-text">Searching for opponent...</p>
                        <button className="searching-cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <img src="/landmine_logo.png" alt="" className="bomb" aria-hidden="true" />
            <img src="/landmine_logo.png" alt="" className="bomb" aria-hidden="true" />
            <img src="/landmine_logo.png" alt="" className="bomb" aria-hidden="true" />
            <img src="/landmine_logo.png" alt="" className="bomb" aria-hidden="true" />
        </div>
    );
};

export default HomePage;
