import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { findUsersByInputString } from "../../api/index.js";
import "./style.css";

const SearchPage = () => {
    const [inputStr, setInputStr] = useState("");
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async () => {
        setError(null);
        setHasSearched(true);
        try {
            const data = await findUsersByInputString(inputStr);
            setResults(data.users || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUserClick = (username) => {
        navigate(`/profile/${username}`);
    };

    return (
        <div className="user-search-container">
            <div className="join-create-room-container">
                <h1>Find Users</h1>
                <div className="input-group">
                    <input
                        type="text"
                        className="room-input"
                        placeholder="Enter username"
                        value={inputStr}
                        onChange={(e) => {
                            setInputStr(e.target.value);
                            setHasSearched(false); // reset when typing
                        }}
                    />
                    <button className="create-room-button" onClick={handleSearch}>
                        Search
                    </button>
                </div>
                {error && <p className="room-message">{error}</p>}
                <div className="results-list">
                    {results.length > 0 ? (
                        results.map((user) => (
                            <div
                                key={user._id}
                                className="user-result"
                                onClick={() => handleUserClick(user.username)}
                            >
                                <span className="username">{user.username}</span>
                                <span className="elo">ELO: {user.elo}</span>
                            </div>
                        ))
                    ) : hasSearched ? (
                        <p className="no-results">No users found.</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
