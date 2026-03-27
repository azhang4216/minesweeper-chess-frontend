import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    useUsername,
    useIsPlayingAsGuest,
    useIsLoggedIn,
} from "../../hooks";
import {
    getUserProfileByUsername,
    deleteAccount,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getGamesByUsername,
} from "../../api/profile";
import ConfirmModal from "../confirm-modal";
import { useDispatch } from 'react-redux';
import { actions } from "../../redux";
import "./style.css";

const ProfilePage = () => {
    const username = useUsername();
    const { username: profileUsername } = useParams();
    const isGuest = useIsPlayingAsGuest();
    const isLoggedIn = useIsLoggedIn();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [profileData, setProfileData] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [friendRequestsReceived, setFriendRequestsReceived] = useState([]);
    const [friendsList, setFriendsList] = useState([]);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [pastGames, setPastGames] = useState([]);
    const [gamesPage, setGamesPage] = useState(1);
    // eslint-disable-next-line
    const [gamesLimit, setGamesLimit] = useState(10);
    const [totalGames, setTotalGames] = useState(0);
    const [actionMsg, setActionMsg] = useState('');

    const notify = (msg) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(''), 3000);
    };

    useEffect(() => {
        const fetchprofileData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getUserProfileByUsername(profileUsername);
                setProfileData(data);
                setFriendRequestsReceived(data.friendRequestsReceived?.length > 0 ? data.friendRequestsReceived : []);
                setFriendsList(data.friends?.length > 0 ? data.friends : []);
                setNotFound(false);
            } catch (err) {
                if (err.response && err.response.status === 404) setNotFound(true);
                else setError("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchprofileData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileUsername]);

    useEffect(() => {
        if (profileData && username) setIsOwnProfile(profileData.username === username);
    }, [profileData, username]);

    useEffect(() => {
        const fetchPastGames = async () => {
            try {
                const data = await getGamesByUsername(profileUsername, gamesPage, gamesLimit);
                setPastGames(data.games || []);
                setTotalGames(data.totalGames || 0);
            } catch {
                setPastGames([]);
            }
        };
        fetchPastGames();
    }, [profileUsername, gamesPage, gamesLimit]);

    const handleSendFriendRequest = async () => {
        try {
            await sendFriendRequest(profileUsername, username);
            notify("Friend request sent!");
        } catch (err) {
            notify(err.response?.data?.error || "Failed to send friend request.");
        }
    };

    const refreshProfile = async () => {
        const data = await getUserProfileByUsername(username);
        setProfileData(data);
        setFriendRequestsReceived(data.friendRequestsReceived || []);
        setFriendsList(data.friends || []);
    };

    const handleAcceptFriend = async (requesterUsername) => {
        try {
            await acceptFriendRequest(username, requesterUsername);
            notify(`${requesterUsername} added to friends.`);
            await refreshProfile();
        } catch (err) {
            notify(err.response?.data?.error || "Failed to accept friend request.");
        }
    };

    const handleRejectFriend = async (requesterUsername) => {
        try {
            await rejectFriendRequest(username, requesterUsername);
            notify("Request declined.");
            await refreshProfile();
        } catch (err) {
            notify(err.response?.data?.error || "Failed to reject friend request.");
        }
    };

    const handleRemoveFriend = async (friendUsername) => {
        try {
            await removeFriend(username, friendUsername);
            notify(`Removed ${friendUsername}.`);
            await refreshProfile();
        } catch (err) {
            notify(err.response?.data?.error || "Failed to remove friend.");
        }
    };

    const handleDeleteAccountConfirmed = async () => {
        setShowConfirmDelete(false);
        try {
            await deleteAccount(username);
            dispatch(actions.logOut());
            navigate("/");
        } catch (err) {
            notify(err.response?.data?.error || "Failed to delete account.");
        }
    };

    const totalPages = Math.ceil(totalGames / gamesLimit);

    const formatEloChange = (change) => {
        const val = parseInt(change?.$numberInt || change);
        if (isNaN(val)) return null;
        return { val, color: val >= 0 ? '#4ade80' : '#f87171', prefix: val >= 0 ? '+' : '' };
    };

    const formatDate = (raw) => {
        const d = new Date(raw?.$date?.$numberLong || raw);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const resultLabel = (result) => {
        if (result === '1-0') return { text: 'White wins', cls: 'result-white' };
        if (result === '0-1') return { text: 'Black wins', cls: 'result-black' };
        return { text: 'Draw', cls: 'result-draw' };
    };

    if (loading) return <div className="profile-state-msg">Loading...</div>;
    if (notFound) return <div className="profile-state-msg">Player not found.</div>;
    if (error)    return <div className="profile-state-msg">{error}</div>;
    if (!profileData) return <div className="profile-state-msg">Something went wrong.</div>;

    const isDeleted = profileData.status === "DELETED";

    return (
        <>
            <div className={`profile-page${isDeleted ? ' profile-page--deleted' : ''}`}>
                <div className="profile-hero">
                    <div className="profile-hero-left">
                        <div className="profile-name">
                            {profileData.username}
                            {profileData.role === "admin" && (
                                <span className="profile-tooltip-wrap">
                                    <span className="profile-role-badge">🌟</span>
                                    <span className="profile-tooltip">This user is an admin.</span>
                                </span>
                            )}
                            {profileData.role === "mod" && (
                                <span className="profile-tooltip-wrap">
                                    <span className="profile-role-badge">⭐️</span>
                                    <span className="profile-tooltip">This user is a mod.</span>
                                </span>
                            )}
                            {isDeleted && <span className="profile-deleted-tag">DELETED</span>}
                        </div>
                        <div className="profile-meta">
                            Joined {new Date(profileData.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                        </div>
                    </div>
                    <div className="profile-elo-block">
                        <div className="profile-elo-value">{profileData.elo}</div>
                        <div className="profile-elo-label">ELO</div>
                    </div>
                </div>

                {actionMsg && <div className="profile-action-msg">{actionMsg}</div>}

                <div className="profile-actions">
                    {isOwnProfile ? (
                        <>
                            <span className="profile-tooltip-wrap">
                                <button className="profile-btn profile-btn--ghost" disabled>
                                    Edit Profile
                                </button>
                                <span className="profile-tooltip profile-tooltip--below">Coming soon</span>
                            </span>
                            <button className="profile-btn profile-btn--danger" onClick={() => setShowConfirmDelete(true)}>
                                Delete Account
                            </button>
                        </>
                    ) : (
                        isLoggedIn && !isGuest && !isDeleted && (
                            <button className="profile-btn profile-btn--primary" onClick={handleSendFriendRequest}>
                                Add Friend
                            </button>
                        )
                    )}
                </div>

                <div className="profile-sections">
                    {isOwnProfile && (
                        <div className="profile-card">
                            <div className="profile-card-title">FRIEND REQUESTS</div>
                            {friendRequestsReceived.length > 0 ? (
                                <ul className="profile-list">
                                    {friendRequestsReceived.map((f) => (
                                        <li key={f.id} className="profile-list-item">
                                            <Link to={`/profile/${f.username}`} className="profile-link" target="_blank" rel="noopener noreferrer">
                                                {f.username}
                                            </Link>
                                            <div className="profile-req-actions">
                                                <button className="profile-btn-sm profile-btn-sm--accept" onClick={() => handleAcceptFriend(f.username)}>✓</button>
                                                <button className="profile-btn-sm profile-btn-sm--reject" onClick={() => handleRejectFriend(f.username)}>✕</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="profile-empty">No pending requests.</p>
                            )}
                        </div>
                    )}

                    <div className="profile-card">
                        <div className="profile-card-title">FRIENDS</div>
                        {friendsList.length > 0 ? (
                            <ul className="profile-list">
                                {friendsList.map((f) => (
                                    <li key={f.id} className="profile-list-item">
                                        <Link to={`/profile/${f.username}`} className="profile-link" target="_blank" rel="noopener noreferrer">
                                            {f.username}
                                        </Link>
                                        {isOwnProfile && (
                                            <button className="profile-btn-sm profile-btn-sm--reject" onClick={() => handleRemoveFriend(f.username)}>
                                                Remove
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="profile-empty">No friends yet.</p>
                        )}
                    </div>
                </div>

                <div className="profile-card profile-card--wide">
                    <div className="profile-card-title">PAST GAMES</div>
                    {pastGames.length > 0 ? (
                        <>
                            <div className="games-table-wrap">
                                <table className="games-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>White</th>
                                            <th>Black</th>
                                            <th>Result</th>
                                            <th>Bombs</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pastGames.map((game) => {
                                            const whiteElo = formatEloChange(game.white_player.elo_change);
                                            const blackElo = formatEloChange(game.black_player.elo_change);
                                            const res = resultLabel(game.result);
                                            return (
                                                <tr key={game._id}>
                                                    <td>{formatDate(game.date)}</td>
                                                    <td>
                                                        {game.white_player.is_guest ? 'Guest' : game.white_player.player_id}
                                                        {whiteElo && (
                                                            <span className="games-elo-change" style={{ color: whiteElo.color }}>
                                                                {' '}{whiteElo.prefix}{whiteElo.val}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {game.black_player.is_guest ? 'Guest' : game.black_player.player_id}
                                                        {blackElo && (
                                                            <span className="games-elo-change" style={{ color: blackElo.color }}>
                                                                {' '}{blackElo.prefix}{blackElo.val}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td><span className={`games-result ${res.cls}`}>{res.text}</span></td>
                                                    <td className="games-bombs">{game.bombs.join(", ")}</td>
                                                    <td>
                                                        <Link to={`/game/${game._id}`} className="profile-link" target="_blank" rel="noopener noreferrer">
                                                            View →
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="games-pagination">
                                    <button
                                        className="profile-btn profile-btn--ghost"
                                        disabled={gamesPage === 1}
                                        onClick={() => setGamesPage(p => p - 1)}
                                    >
                                        ← Prev
                                    </button>
                                    <span className="games-page-label">Page {gamesPage} of {totalPages}</span>
                                    <button
                                        className="profile-btn profile-btn--ghost"
                                        disabled={gamesPage === totalPages}
                                        onClick={() => setGamesPage(p => p + 1)}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="profile-empty">No past games yet.</p>
                    )}
                </div>
            </div>

            {showConfirmDelete && (
                <ConfirmModal
                    message="Delete your account? This is permanent and cannot be undone."
                    onConfirm={handleDeleteAccountConfirmed}
                    onCancel={() => setShowConfirmDelete(false)}
                />
            )}
        </>
    );
};

export default ProfilePage;
