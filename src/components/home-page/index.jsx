import { useNavigate } from 'react-router-dom';
import { GAME_STATES } from '../../constants';
import { useGameState } from "../../hooks";
import { useDispatch } from 'react-redux';
import { actions } from "../../redux";
import { generateGuestUUID } from "../../api";
import { useIsLoggedIn } from '../../hooks';
import './style.css';

const HomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const gameState = useGameState();
    const isLoggedIn = useIsLoggedIn();

    const handleSignIn = () => {
        navigate("/sign-in");
    };

    const handlePlayAsGuest = async () => {
        try {
            const assignedGuestID = await generateGuestUUID();
            console.log(`Got assigned guest ID: ${assignedGuestID}`);
            dispatch(actions.playAsGuest(assignedGuestID));
        } catch (e) {
            console.error("Failed to generate guest UUID:", e);
        }
    };

    const handleCreateRoom = () => {
        navigate("/create-room");
    };

    const handleJoinRoom = () => {
        navigate("/join-room");
    };

    const ButtonGroups = () => {
        if (isLoggedIn) {
            return (
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
            )
        } else {
            return (
                <div className="button-group">
                    <button onClick={handleSignIn} className="sign-in-button">
                        Sign In
                    </button>
                    <button onClick={handlePlayAsGuest} className="guest-button">
                        Play as Guest
                    </button>
                </div>
            )
        }
    };

    return (
        <div className="front-page">
            <img src="/landmine_white.png" alt="Landmine Chess Logo" className="logo" />
            <div className="chess-wrapper">
                <div className="join-create-room-container">
                    {ButtonGroups()}
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
