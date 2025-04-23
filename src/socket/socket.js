import { io } from "socket.io-client";

// TODO: replace with backend url in PROD
const socket = io("http://localhost:4000");

export default socket;
