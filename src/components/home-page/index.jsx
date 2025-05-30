import { useNavigate } from 'react-router-dom';
import { GAME_STATES } from '../../constants';
import { useGameState } from "../../hooks";
import { useAuth } from "../../hooks/useAuth";
import './style.css';

const HomePage = () => {
    const navigate = useNavigate();
    const gameState = useGameState();
    const { user, login } = useAuth();

    const handleSignIn = () => {
        navigate("/sign-in");
    };

    const handlePlayAsGuest = () => {
        login({ guest: true });
    };

    const handleCreateRoom = () => {
        navigate("/create-room");
    };

    const handleJoinRoom = () => {
        navigate("/join-room");
    };

    return (
        <div className="front-page">
            <img src="/landmine_white.png" alt="Landmine Chess Logo" className="logo" />
            <div className="chess-wrapper">
                <div className="join-create-room-container">
                    {!user ? (
                        <div className="button-group">
                            <button onClick={handleSignIn} className="sign-in-button">
                                Sign In
                            </button>
                            <button onClick={handlePlayAsGuest} className="guest-button">
                                Play as Guest
                            </button>
                        </div>
                    ) : (
                        <div className="button-group">
                            <button onClick={handleCreateRoom} className="create-room-button">
                                Create Room
                            </button>
                            <button
                                onClick={handleJoinRoom}
                                disabled={gameState === GAME_STATES.matching}
                                className="join-room-button"
                            >
                                Join Room
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <img src="/landmine_logo.png" alt="Floating Bomb" className="bomb" />
            <img src="/landmine_logo.png" alt="Floating Bomb" className="bomb" />
            <img src="/landmine_logo.png" alt="Floating Bomb" className="bomb" />
            <img src="/landmine_logo.png" alt="Floating Bomb" className="bomb" />
        </div>
    );
};

export default HomePage;
