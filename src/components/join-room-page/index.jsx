import React, { useEffect, useState } from "react";
import { useSocket } from "../../socket";
import { useDispatch } from 'react-redux';
import { actions } from '../../redux';
import { useNavigate } from "react-router-dom";
import { GAME_STATES } from '../../constants';
import "./style.css";

const JoinRoomPage = () => {
    const socket = useSocket();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [rooms, setRooms] = useState([]);                 // all rooms
    const [filteredRooms, setFilteredRooms] = useState([]); // just the filtered ones we display
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [timeFilter, setTimeFilter] = useState(null);
    const [eloFilter, setEloFilter] = useState([0, 3000]);  // in seconds

    // TODO: a way to search via pages


    // for searching for all active rooms on load
    useEffect(() => {
        if (!socket) return;
        // Emit event to fetch all active rooms
        socket.emit("requestRoomsLookingForMatch", (response) => {
            if (response.success) {
                setRooms(response.rooms);
            } else {
                setError("Failed to fetch rooms. Please try again.");
            }
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // for filtering down only to what we have selected
    useEffect(() => {
        setFilteredRooms(rooms
            .filter((room) => {
                if (timeFilter && room.time_control !== timeFilter) return false;
                return true;
            })
            .filter((room) => {
                const elo = room.elo;
                return elo >= eloFilter[0] && elo <= eloFilter[1];
            })
        );
    }, [timeFilter, eloFilter, rooms]);

    // for listening for when we join a room
    useEffect(() => {
        const handleRoomJoined = (data) => {
            console.log("Joined room:", data);

            // set our game state before navigating over, so our protected route doesn't reroute to home
            dispatch(actions.setGameState(GAME_STATES.placing_bombs));

            navigate("/play-game", { state: data });
        };

        socket.on("roomJoined", handleRoomJoined);

        return () => {
            socket.off("roomJoined", handleRoomJoined);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshRooms = () => {
        setLoading(true);
        setError("");
        socket.emit("requestRoomsLookingForMatch", (response) => {
            if (response.success) {
                setRooms(response.rooms);
            } else {
                setError("Failed to fetch rooms. Please try again.");
            }
            setLoading(false);
        });
    };

    const handleTimeFilterChange = (e) => setTimeFilter(parseInt(e.target.value, 10));

    const handleEloFilterChange = (e) => {
        const [min, max] = e.target.value.split('-').map(Number);
        setEloFilter([min, max]);
    };

    const joinRoom = (roomId) => {
        socket.emit("joinRoom", roomId, (response) => {
            if (!response.success) {
                setError(response.message);
            }
        });
    };

    return (
        <div className="join-room-page">
            <button
                onClick={() => navigate("/")}
                className="back-button"
                disabled={loading}
            >
                ← Back to Home
            </button>
            <div className="join-room-container">
                <div className="join-room-title-row">
                    <h2 className="title-center">Active Rooms</h2>

                    <div className="refresh-button-wrapper">
                        <button onClick={refreshRooms}>Refresh Rooms</button>
                    </div>
                </div>

                {loading && <p>Loading rooms...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}

                <div className="filters-row">
                    <span className="filters-label">Filter by:</span>

                    <div>
                        <label>
                            Time Control:
                            <select
                                id="time-filter"
                                name="time-filter"
                                onChange={handleTimeFilterChange}
                                value={timeFilter || ''}
                            >
                                <option value="">All</option>
                                <option value={60}>1 minute</option>
                                <option value={180}>3 minutes</option>
                                <option value={300}>5 minutes</option>
                                <option value={600}>10 minutes</option>
                            </select>
                        </label>
                    </div>


                    <div>
                        <label>
                            Elo Range:
                            <select
                                id="elo-filter"
                                name="elo-filter"
                                onChange={handleEloFilterChange}
                                value={`${eloFilter[0]}-${eloFilter[1]}`}
                            >
                                <option value="0-3000">All</option>
                                <option value="0-1400">0-1400</option>
                                <option value="1400-2000">1400-2000</option>
                                <option value="2000-3000">2000-3000</option>
                            </select>
                        </label>
                    </div>
                </div>

                {filteredRooms.length > 0 ? (
                    <table className="room-table">
                        <thead>
                            <tr>
                                <th>Room ID</th>
                                <th>Opponent ELO</th>
                                <th>Time Control</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRooms.map((room) => (
                                <tr key={room.id}>
                                    <td>{room.id.length > 15 ? `${room.id.slice(0, 12)}...` : room.id}</td>
                                    {/* <td>{room.id}</td> */}
                                    <td>{room.elo}</td>
                                    <td>
                                        {room.time_control % 60 === 0
                                            ? `${room.time_control / 60} minute${room.time_control / 60 > 1 ? "s" : ""}`
                                            : `${room.time_control} seconds`}
                                    </td>
                                    <td>
                                        <button
                                            className="join-room-btn"
                                            onClick={() => joinRoom(room.id)}
                                        >
                                            Join Room
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No active rooms available.</p>
                )}

            </div>
        </div>
    );
}

export default JoinRoomPage;
