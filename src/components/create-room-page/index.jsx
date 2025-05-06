import React, { useState } from "react";
import { useSocket } from "../../socket";
import { useNavigate } from "react-router-dom";
import { Loader } from "../";
import "./style.css";

const CreateRoomPage = () => {
    const socket = useSocket();
    const [loading, setLoading] = useState(false);
    const [roomId, setRoomId] = useState("");
    const [timeControl, setTimeControl] = useState(""); // in seconds (string)
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const createRoom = () => {
        if (!roomId) {
            setError("Please enter a room ID.");
            return;
        }

        if (!timeControl) {
            setError("Please select a time control.");
            return;
        }

        setLoading(true);
        setError("");

        // Emit event to backend to create a room with the specified roomId & time control
        socket.emit("createRoom", { roomId, timeControl }, (response) => {
            if (response.success) {
                setLoading(true);
            } else {
                setLoading(false);
                setError(response.message);
            }
        });
    };

    const cancelRoomCreation = () => {
        socket.emit("cancelRoom", { roomId }, (response) => {
            if (response.success) {
                setLoading(false);
                setRoomId("");
                setTimeControl("");
                setError("");
            }
            setError(response.message);
        });
    };

    // Prompt user when navigating away during loading
    // usePrompt(
    //     loading,
    //     "Are you sure you want to exit and cancel your room creation?"
    // );

    // Warn user if they refresh/close tab while loading
    // useEffect(() => {
    //     const handleBeforeUnload = (e) => {
    //         if (loading) {
    //             const message = "Are you sure you want to exit and cancel your room creation?";
    //             e.preventDefault();
    //             e.returnValue = message;
    //             return message; // required by some older browsers
    //         }
    //     };

    //     window.addEventListener("beforeunload", handleBeforeUnload);
    //     return () => {
    //         window.removeEventListener("beforeunload", handleBeforeUnload);
    //     };
    // }, [loading]);

    return (
        <div className="create-room-page">
            <button
                onClick={() => navigate("/")}
                className="back-button"
                disabled={loading}
            >
                ← Back to Home
            </button>

            <div className="create-room-container">
                <h2>Create a New Room</h2>

                <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter a room ID"
                    disabled={loading}
                />

                <select
                    value={timeControl}
                    onChange={(e) => setTimeControl(e.target.value)}
                    disabled={loading}
                >
                    <option value="">Select Time Control</option>
                    <option value="60">1 Minute</option>
                    <option value="180">3 Minutes</option>
                    <option value="300">5 Minutes</option>
                    <option value="600">10 Minutes</option>
                </select>

                {!loading ?
                    <button onClick={createRoom}>
                        Create Room
                    </button> :
                    <button onClick={cancelRoomCreation}>
                        Cancel
                    </button>
                }

                {loading && <Loader />}

                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>


        </div>
    );
}

export default CreateRoomPage;
