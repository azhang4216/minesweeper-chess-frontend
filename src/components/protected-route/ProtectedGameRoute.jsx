import { Navigate } from "react-router-dom";
import { GAME_STATES } from "../../constants";
import { useGameState, useIsLoggedIn } from '../../hooks';

export default function ProtectedGameRoute({ children }) {
    const gameState = useGameState();
    const isLoggedIn = useIsLoggedIn();

    if (!isLoggedIn || (gameState !== GAME_STATES.playing && gameState !== GAME_STATES.placing_bombs && gameState !== GAME_STATES.game_over)) {
        // If not playing, kick them back to home page
        return <Navigate to="/" replace />;
    }

    // Otherwise, show the page
    return children;
}
