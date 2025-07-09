import { io } from "socket.io-client";
import API_BASE_URL from "../config";

const socket = io(API_BASE_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5
});

export default socket;
