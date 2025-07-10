import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    useUsername,
    useIsPlayingAsGuest,
    useIsLoggedIn,
} from "../../hooks";
import {
    getUserProfile,
    deleteAccount,
    addFriend,
    acceptFriend,
    logoutUser
} from "../../api";
import ConfirmModal from "../confirm-modal";
import "./style.css";

const ProfilePage = () => {
    const { username } = useParams();
    const currentUsername = useUsername();
    const isGuest = useIsPlayingAsGuest();
    const isLoggedIn = useIsLoggedIn();
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const isOwnProfile =
        userData && currentUsername && userData.username === currentUsername;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getUserProfile(username);
                setUserData(data);
                setNotFound(false);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setNotFound(true);
                } else {
                    setError("Failed to load profile.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [username]);

    const handleAddFriend = async () => {
        try {
            await addFriend(currentUsername, username);
            alert("Friend request sent!");
        } catch (err) {
            console.error("Failed to send friend request:", err);
            alert("Failed to send friend request.");
        }
    };

    const handleDeleteAccountConfirmed = async () => {
        setShowConfirmDelete(false);
        try {
            await deleteAccount(currentUsername);
            alert("Account deleted successfully.");
            logoutUser();
            navigate("/");
        } catch (err) {
            console.error("Failed to delete account:", err);
            alert("Failed to delete account.");
        }
    };

    const handleDeleteAccountCancel = () => {
        setShowConfirmDelete(false);
    };

    const handleAcceptFriend = async (friendUsername) => {
        try {
            await acceptFriend(currentUsername, friendUsername);
            alert(`Friend request from ${friendUsername} accepted!`);
            // Optionally refresh the profile data to update lists:
            // You can trigger fetchUserData here or set state accordingly
        } catch (err) {
            console.error("Failed to accept friend request:", err);
            alert("Failed to accept friend request.");
        }
    };

    const handleRejectFriend = (friendUsername) => {
        // Placeholder for now
        alert(`Reject friend request from ${friendUsername} (functionality not implemented yet).`);
    };

    if (loading)
        return <div className="profile-page-message">Loading profile...</div>;
    if (notFound)
        return <div className="profile-page-message">User not found.</div>;
    if (error)
        return <div className="profile-page-message">{error}</div>;
    if (!userData)
        return <div className="profile-page-message">Something went wrong.</div>;

    return (
        <>
            <div className="profile-page-full">
                <h1 className="profile-username">{userData.username}</h1>
                <p className="profile-elo">ELO: {userData.elo}</p>

                <div className="profile-actions">
                    {isOwnProfile ? (
                        <>
                            <button className="edit-button">Edit Profile</button>
                            <button
                                className="delete-button"
                                onClick={() => setShowConfirmDelete(true)}
                            >
                                Delete Account
                            </button>
                        </>
                    ) : (
                        isLoggedIn &&
                        !isGuest && (
                            <button className="create-room-button" onClick={handleAddFriend}>
                                Send Friend Request
                            </button>
                        )
                    )}
                </div>

                {isOwnProfile && (
                    <div className="scroll-section">
                        <h2>Friend Requests Received</h2>
                        {userData.friendRequestsReceived?.length > 0 ? (
                            <ul className="scroll-list">
                                {userData.friendRequestsReceived.map((req) => (
                                    <li key={req._id} className="scroll-item friend-request-item">
                                        <Link to={`/profile/${req.username}`} className="friend-link">
                                            {req.username}
                                        </Link>
                                        <div className="friend-request-actions">
                                            <button
                                                className="accept-button"
                                                onClick={() => handleAcceptFriend(req.username)}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                className="reject-button"
                                                onClick={() => handleRejectFriend(req.username)}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-results">No friend requests.</p>
                        )}
                    </div>
                )}

                <div className="scroll-section">
                    <h2>Friends</h2>
                    {userData.friends?.length > 0 ? (
                        <ul className="scroll-list">
                            {userData.friends.map((friend) => (
                                <li key={friend._id} className="scroll-item">
                                    <Link
                                        to={`/profile/${friend.username}`}
                                        className="friend-link"
                                    >
                                        {friend.username}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-results">No friends yet.</p>
                    )}
                </div>

                <div className="scroll-section">
                    <h2>Past Games</h2>
                    {userData.past_games?.length > 0 ? (
                        <ul className="scroll-list">
                            {userData.past_games.map((game) => (
                                <li key={game._id} className="scroll-item">
                                    <Link to={`/game/${game._id}`} className="friend-link">
                                        Game ID: {game._id}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-results">No past games yet.</p>
                    )}
                </div>
            </div>

            {showConfirmDelete && (
                <ConfirmModal
                    message="Are you sure you want to delete your account? This action is permanent."
                    onConfirm={handleDeleteAccountConfirmed}
                    onCancel={handleDeleteAccountCancel}
                />
            )}
        </>
    );
};

export default ProfilePage;
