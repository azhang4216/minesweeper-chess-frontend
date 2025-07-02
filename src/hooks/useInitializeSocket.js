import { useEffect } from "react";
import socket from "../socket";

const useInitializeSocket = () => {
    useEffect(() => {
        const playerId = localStorage.getItem("playerId");
        if (!playerId) return;

        // Set auth before connecting
        socket.auth = { playerId };
        socket.connect();

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("rejoin", playerId);
        });

        socket.on("rejoined", (data) => {
            console.log("Rejoined room:", data.roomId);
        });

        return () => {
            socket.off("connect");
            socket.off("rejoined");
            socket.disconnect();
        };
    }, []);
};

export default useInitializeSocket;
