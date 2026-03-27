import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { findUsersByInputString } from "../../api/index.js";
import "./style.css";

const SearchPage = () => {
    const [inputStr, setInputStr] = useState("");
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!inputStr.trim()) return;
        setError(null);
        setHasSearched(true);
        setLoading(true);
        try {
            const data = await findUsersByInputString(inputStr);
            setResults(data.users || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleUserClick = (username) => {
        navigate(`/profile/${username}`);
    };

    return (
        <div className="search-page">
            <div className="search-panel">
                <div className="search-header">
                    <div className="search-headline">FIND A PLAYER</div>
                    <div className="search-subtext">Why are you stalking someone? Ew, creepy muchhh</div>
                </div>

                <div className="search-input-row">
                    <div className="search-input-wrap">
                        <span className="search-icon">⌕</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Enter username..."
                            value={inputStr}
                            onChange={(e) => {
                                setInputStr(e.target.value);
                                setHasSearched(false);
                            }}
                            onKeyDown={handleKeyDown}
                            autoComplete="off"
                            spellCheck="false"
                        />
                    </div>
                    <button
                        className="search-btn"
                        onClick={handleSearch}
                        disabled={loading || !inputStr.trim()}
                    >
                        {loading ? '...' : 'Search'}
                    </button>
                </div>

                {error && <p className="search-error">{error}</p>}

                {hasSearched && (
                    <div className="search-results">
                        {results.length > 0 ? (
                            results.map((user) => (
                                <div
                                    key={user._id}
                                    className="search-result-row"
                                    onClick={() => handleUserClick(user.username)}
                                >
                                    <span className="search-result-name">{user.username}</span>
                                    <span className="search-result-elo">{user.elo} ELO</span>
                                </div>
                            ))
                        ) : (
                            <p className="search-no-results">No targets found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
