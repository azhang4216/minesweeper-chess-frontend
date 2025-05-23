import { io } from "socket.io-client";

const socket = io(
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_API_URL
        : "http://localhost:4000"
);

export default socket;
