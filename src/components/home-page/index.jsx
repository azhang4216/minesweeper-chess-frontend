import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_STATES } from '../../constants';
import { useGameState, useIsLoggedIn, usePlayer } from "../../hooks";
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

const TAGLINES = [
    'Chess. But with landmines.',
    'Outsmart them. Then blow them up.',
    'The board remembers everything.',
    'Every square is a gamble.',
    'They never saw it coming.',
    'Strategy meets sabotage.',
    'Place wisely. Play dirty.',
    'Here comes the BOOM!',
    'Wait — kings can explode?!',
    'Mine your own business.',
    'En passant? More like en ka-BOOM.',
    'Checkmate is the boring way to win.',
    'It\'s not a trap if it explodes.',
    'Magnus doesn\'t know about this yet.',
    'Check. Mate. Boom.',
    'Step carefully. No, seriously.',
    'The queen is safe. Probably.',
    'Fischer never had this problem.',
    'FIDE has not approved this.',
    'This is fine.',
    'That\'s not a fork. That\'s a detonator.',
    'Elo goes up. Pieces go boom.',
    'Warning: may cause sudden piece loss.',
    'Oh no, my queen-- BOOM. (Sorry, Eric.)',
    'If takes takes takes then takes then takes then BOOM wait what??',
    'And she sacrificed THE ROOK!!! ...into a mine.',
];

const SEARCH_LINES = [
    'Searching for someone to humiliate...',
    'Scanning the threat database...',
    'Locating your next victim...',
    'Calculating their inevitable doom...',
    'Finding someone who trusts you...',
    'Recruiting a willing sacrifice...',
];

const HomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const socket = useSocket();
    const gameState = useGameState();
    const isLoggedIn = useIsLoggedIn();
    const player = usePlayer();

    const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);
    const [selectedTimeControl, setSelectedTimeControl] = useState(180);
    const [searching, setSearching] = useState(false);
    const [queueError, setQueueError] = useState('');
    const [searchLine, setSearchLine] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const elapsedRef = useRef(null);

    // Reset game state when landing on home page so the Play Game button is always usable
    useEffect(() => {
        dispatch(actions.setGameState(GAME_STATES.inactive));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cycle copy + track elapsed time while searching
    useEffect(() => {
        if (!searching) {
            setSearchLine(0);
            setElapsed(0);
            return;
        }

        const copyTimer = setInterval(() => {
            setSearchLine(i => (i + 1) % SEARCH_LINES.length);
        }, 3000);

        elapsedRef.current = setInterval(() => {
            setElapsed(s => s + 1);
        }, 1000);

        return () => {
            clearInterval(copyTimer);
            clearInterval(elapsedRef.current);
        };
    }, [searching]);

    const formatElapsed = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `0:${String(sec).padStart(2, '0')}`;
    };

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
                    {player?.rating != null && (
                        <div className="player-elo-badge">{player.rating} ELO</div>
                    )}
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
                        disabled={gameState !== GAME_STATES.inactive && gameState !== GAME_STATES.game_over}
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
            <p className="tagline">{tagline}</p>
            <div className="join-create-room-container">
                {ButtonGroups()}
            </div>

            {searching && (
                <div className="searching-overlay">
                    <div className="searching-popup">
                        <div className="searching-mine">
                            <div className="mine-body" />
                            <div className="mine-spike mine-spike--top" />
                            <div className="mine-spike mine-spike--right" />
                            <div className="mine-spike mine-spike--bottom" />
                            <div className="mine-spike mine-spike--left" />
                            <div className="mine-spike mine-spike--tr" />
                            <div className="mine-spike mine-spike--tl" />
                            <div className="mine-spike mine-spike--br" />
                            <div className="mine-spike mine-spike--bl" />
                        </div>
                        <p className="searching-text">{SEARCH_LINES[searchLine]}</p>
                        <p className="searching-elapsed">{formatElapsed(elapsed)}</p>
                        <button className="searching-cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <img src="/landmine_logo.png" alt="" className="bomb bomb--1" aria-hidden="true" />
            <img src="/landmine_logo.png" alt="" className="bomb bomb--2" aria-hidden="true" />
            <img src="/landmine_logo.png" alt="" className="bomb bomb--3" aria-hidden="true" />
            <img src="/landmine_logo.png" alt="" className="bomb bomb--4" aria-hidden="true" />
        </div>
    );
};

export default HomePage;
