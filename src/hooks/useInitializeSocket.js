import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../socket";
import { actions } from "../redux";
import { GAME_STATES } from "../constants";
import { useUsername } from "./";

const useInitializeSocket = () => {
    const dispatch = useDispatch();
    const myUsername = useUsername();

    useEffect(() => {
        const playerId = localStorage.getItem("playerId");
        if (!playerId) return;

        socket.auth = { playerId };
        socket.connect();

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("rejoin", playerId);
        });

        socket.on("rejoined", (data) => {
            console.log("Rejoined room:", data.roomId);

            if (data.gameFen && data.players) {
                const me = data.players.find(p => p.user_id === myUsername);
                const opponent = data.players.find(p => p.user_id !== myUsername);
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
                    data.moveHistory.forEach(san => {
                        dispatch(actions.updateGameFromServer(null, san));
                    });
                }

                dispatch(actions.setTimers({
                    whiteTimeLeft: data.whiteTimeLeft,
                    blackTimeLeft: data.blackTimeLeft,
                }));
            }
        });

        return () => {
            socket.off("connect");
            socket.off("rejoined");
            socket.disconnect();
        };
    // myUsername is stable (set at login, doesn't change mid-session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

export default useInitializeSocket;
