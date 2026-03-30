import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { socket } from "../socket";
import { actions } from "../redux";
import { GAME_STATES } from "../constants";
import { useUsername } from "./";

const useInitializeSocket = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const myUsername = useUsername();

    const myUsernameRef = useRef(myUsername);
    const locationRef = useRef(location);

    // Update synchronously in render body (not in useEffect) so socket handlers
    // never see a stale pathname — effects run after paint, creating a brief window.
    myUsernameRef.current = myUsername;
    locationRef.current = location;

    const [rematchBanner, setRematchBanner] = useState(null); // { from: string } | null

    useEffect(() => {
        const handleRejoined = (data) => {
            if (!data.players) return;

            const me = data.players.find(p => p.user_id === myUsernameRef.current);
            const opponent = data.players.find(p => p.user_id !== myUsernameRef.current);
            if (!me || !opponent) return;

            dispatch(actions.resetGame());
            dispatch(actions.setOrientation(me.is_white));
            dispatch(actions.setGameState(data.gameState ?? GAME_STATES.playing));

            dispatch(actions.setPlayerInfo({
                name: me.username,
                rating: me.elo,
                bombs: me.bombs ?? [],
                secondsLeft: me.is_white ? data.whiteTimeLeft : data.blackTimeLeft,
            }));

            dispatch(actions.setOpponentInfo({
                name: opponent.username,
                rating: opponent.elo,
                bombs: opponent.bombs ?? [],
                secondsLeft: opponent.is_white ? data.whiteTimeLeft : data.blackTimeLeft,
                is_guest: opponent.is_guest ?? false,
            }));

            if (data.gameFen) dispatch(actions.setGameFen(data.gameFen));
            if (Array.isArray(data.moveHistory)) dispatch(actions.setMoveHistory(data.moveHistory));
            if (data.whiteTimeLeft != null) {
                dispatch(actions.setTimers({
                    whiteTimeLeft: data.whiteTimeLeft,
                    blackTimeLeft: data.blackTimeLeft,
                }));
            }

            // Restore bomb-placement timer for placing_bombs rejoins
            if (data.bombTimeLeft != null) {
                dispatch(actions.setPlacingBombSeconds(data.bombTimeLeft));
            }

            navigate("/play-game", { state: { roomId: data.roomId } });
        };

        const handleNoActiveGame = () => {
            // Don't redirect if on a non-game page (e.g. /game/:id analyze view) — the
            // socket always fires rejoin on auth but those pages are read-only and have no active game.
            const path = locationRef.current.pathname;
            if (path !== '/play-game' && path !== '/') {
                dispatch(actions.setGameState(GAME_STATES.inactive));
                return;
            }
            localStorage.removeItem('guestPlayerId'); // clear stale guest session
            dispatch(actions.setGameState(GAME_STATES.inactive));
            navigate("/");
        };

        // Global rematch handlers — delegate to board-page listeners when already on /play-game
        const handleGlobalRematchOffered = ({ from }) => {
            if (locationRef.current.pathname === '/play-game') return;
            setRematchBanner({ from });
        };

        const handleGlobalRematchReady = (gameData) => {
            if (locationRef.current.pathname === '/play-game') return;
            setRematchBanner(null);
            navigate('/play-game', { state: gameData });
        };

        const handleGlobalRematchDeclined = () => {
            if (locationRef.current.pathname === '/play-game') return;
            setRematchBanner(null);
        };

        socket.on("rejoined", handleRejoined);
        socket.on("noActiveGame", handleNoActiveGame);
        socket.on("rematchOffered", handleGlobalRematchOffered);
        socket.on("rematchReady", handleGlobalRematchReady);
        socket.on("rematchDeclined", handleGlobalRematchDeclined);

        return () => {
            socket.off("rejoined", handleRejoined);
            socket.off("noActiveGame", handleNoActiveGame);
            socket.off("rematchOffered", handleGlobalRematchOffered);
            socket.off("rematchReady", handleGlobalRematchReady);
            socket.off("rematchDeclined", handleGlobalRematchDeclined);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const acceptGlobalRematch = () => {
        socket.emit('requestRematch');
        setRematchBanner(null);
    };

    const declineGlobalRematch = () => {
        socket.emit('declineRematch');
        setRematchBanner(null);
    };

    return { rematchBanner, acceptGlobalRematch, declineGlobalRematch };
};

export default useInitializeSocket;
