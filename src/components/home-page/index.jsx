import { useNavigate } from 'react-router-dom';
import { GAME_STATES } from '../../constants';
import { useGameState } from "../../hooks";
import './style.css';

const HomePage = () => {
    const navigate = useNavigate();
    const gameState = useGameState();

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
                    <div className="button-group">
                        <button
                            onClick={handleCreateRoom}
                            className="create-room-button"
                        >
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
