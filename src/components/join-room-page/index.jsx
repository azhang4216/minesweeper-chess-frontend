import React, { useEffect, useState } from "react";
import { useSocket } from "../../socket";

const JoinRoomPage = () => {
    const socket = useSocket();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Emit event to fetch all active rooms
        socket.emit("getRooms", (response) => {
            if (response.success) {
                setRooms(response.rooms);  // Assuming backend sends the room list
            } else {
                setError("Failed to fetch rooms. Please try again.");
            }
            setLoading(false);
        });
    }, [socket]);

    return (
        <div>
            <h2>Active Rooms</h2>
            {loading && <p>Loading rooms...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <ul>
                {rooms.length > 0 ? (
                    rooms.map((room) => (
                        <li key={room.id}>
                            <button onClick={() => console.log(`Joining room: ${room.id}`)}>
                                {room.name}
                            </button>
                        </li>
                    ))
                ) : (
                    <p>No active rooms available.</p>
                )}
            </ul>
        </div>
    );
}

export default JoinRoomPage;
