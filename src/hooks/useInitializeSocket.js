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
            if (data.gameFen && data.players) {
                const me = data.players.find(p => p.user_id === myUsernameRef.current);
                const opponent = data.players.find(p => p.user_id !== myUsernameRef.current);
                if (!me || !opponent) return;

                dispatch(actions.resetGame());
                dispatch(actions.setGameFen(data.gameFen));
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

                if (Array.isArray(data.moveHistory)) {
                    dispatch(actions.setMoveHistory(data.moveHistory));
                }

                dispatch(actions.setTimers({
                    whiteTimeLeft: data.whiteTimeLeft,
                    blackTimeLeft: data.blackTimeLeft,
                }));

                navigate("/play-game");
            }
        };

        socket.on("rejoined", handleRejoined);
        return () => {
            socket.off("rejoined", handleRejoined);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

export default useInitializeSocket;
