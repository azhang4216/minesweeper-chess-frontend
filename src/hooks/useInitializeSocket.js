import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { actions } from "../redux";
import { GAME_STATES } from "../constants";
import { useUsername } from "./";

const useInitializeSocket = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const myUsername = useUsername();
    const myUsernameRef = useRef(myUsername);
    useEffect(() => {
        myUsernameRef.current = myUsername;
    }, [myUsername]);

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
            }));

            if (data.gameFen) {
                dispatch(actions.setGameFen(data.gameFen));
            }

            if (Array.isArray(data.moveHistory)) {
                dispatch(actions.setMoveHistory(data.moveHistory));
            }

            if (data.whiteTimeLeft != null) {
                dispatch(actions.setTimers({
                    whiteTimeLeft: data.whiteTimeLeft,
                    blackTimeLeft: data.blackTimeLeft,
                }));
            }

            navigate("/play-game", { state: { roomId: data.roomId } });
        };

        const handleNoActiveGame = () => {
            dispatch(actions.setGameState(GAME_STATES.inactive));
            navigate("/");
        };

        socket.on("rejoined", handleRejoined);
        socket.on("noActiveGame", handleNoActiveGame);
        return () => {
            socket.off("rejoined", handleRejoined);
            socket.off("noActiveGame", handleNoActiveGame);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

export default useInitializeSocket;
