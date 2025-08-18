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
} from "../../api/profile";
import ConfirmModal from "../confirm-modal";
import { useDispatch } from 'react-redux';
import { actions } from "../../redux";
import "./style.css";

const ProfilePage = () => {
    const username = useUsername();                    // the logged in user's username
    const { username: profileUsername } = useParams(); // the profile being viewed
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

    // Fetch profile data on mount
    useEffect(() => {
        const fetchprofileData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getUserProfileByUsername(profileUsername);
                console.log(data);
                setProfileData(data);

                // Fetch friend usernames for received requests
                if (data.friendRequestsReceived?.length > 0) {
                    setFriendRequestsReceived(data.friendRequestsReceived);
                } else {
                    setFriendRequestsReceived([]);
                }

                // Fetch friend usernames for friends list
                if (data.friends?.length > 0) {
                    setFriendsList(data.friends);
                    console.log(data.friends);
                } else {
                    setFriendsList([]);
                }

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

        fetchprofileData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileUsername]);

    useEffect(() => {
        if (profileData && username) {
            setIsOwnProfile(profileData.username === username);
        }
    }, [profileData, username]);

    // Send friend request
    const handleSendFriendRequest = async () => {
        try {
            await sendFriendRequest(profileUsername, username);
            alert("Friend request sent!");
        } catch (err) {
            console.error("Failed to send friend request:", err);
            alert("Failed to send friend request.");
        }
    };

    // Accept friend request
    const handleAcceptFriend = async (requesterUsername) => {
        try {
            await acceptFriendRequest(username, requesterUsername);
            alert(`Friend request from ${requesterUsername} accepted!`);
            // Refresh profile data
            const data = await getUserProfileByUsername(username);
            setProfileData(data);
            setFriendRequestsReceived(data.friendRequestsReceived || []);
            setFriendsList(data.friends || []);
        } catch (err) {
            console.error("Failed to accept friend request:", err);
            alert("Failed to accept friend request.");
        }
    };

    // Reject friend request
    const handleRejectFriend = async (requesterUsername) => {
        try {
            await rejectFriendRequest(username, requesterUsername);
            alert(`Friend request from ${requesterUsername} rejected.`);
            // Refresh profile data
            const data = await getUserProfileByUsername(username);
            setProfileData(data);
            setFriendRequestsReceived(data.friendRequestsReceived || []);
        } catch (err) {
            console.error("Failed to reject friend request:", err);
            alert("Failed to reject friend request.");
        }
    };

    // Remove friend
    const handleRemoveFriend = async (friendUsername) => {
        try {
            await removeFriend(username, friendUsername);
            alert(`Removed ${friendUsername} from friends.`);
            // Refresh profile data
            const data = await getUserProfileByUsername(username);
            setProfileData(data);
            setFriendsList(data.friends || []);
        } catch (err) {
            console.error("Failed to remove friend:", err);
            alert("Failed to remove friend.");
        }
    };

    const handleDeleteAccountConfirmed = async () => {
        setShowConfirmDelete(false);
        try {
            await deleteAccount(username);
            alert("Account deleted successfully.");
            dispatch(actions.logOut());
            navigate("/");
        } catch (err) {
            console.error("Failed to delete account:", err);
            alert("Failed to delete account.");
        }
    };

    const handleDeleteAccountCancel = () => {
        setShowConfirmDelete(false);
    };

    if (loading)
        return <div className="profile-page-message">Loading profile...</div>;
    if (notFound)
        return <div className="profile-page-message">User not found.</div>;
    if (error)
        return <div className="profile-page-message">{error}</div>;
    if (!profileData)
        return <div className="profile-page-message">Something went wrong.</div>;

    return (
        <>
            <div className={`profile-page-full${profileData.status === "DELETED" ? " profile-deleted" : ""}`}>
                <h1 className="profile-username">
                    {profileData.username}
                    {profileData.role === "admin" && (
                        // TODO: update with another custom emoji
                        <span className="tooltip-wrapper">
                            <span className="role-badge">🌟</span>
                            <span className="tooltip-text-role">This user is an admin.</span>
                        </span>
                    )}
                    {profileData.role === "mod" && (
                        // TODO: update with another custom emoji
                        <span className="tooltip-wrapper">
                            <span className="role-badge">⭐️</span>
                            <span className="tooltip-text-role">This user is a mod.</span>
                        </span>
                    )}
                    {profileData.status === "DELETED" && (
                        <span className="deleted-label"> (Deleted)</span>
                    )}
                </h1>
                <p className="profile-details">ELO: {profileData.elo}</p>
                <p className="profile-details">Joined: {profileData.date_joined}</p>

                <div className="profile-actions">
                    {isOwnProfile ? (
                        <>
                            {/* TODO: edit profile feature */}
                            <span className="tooltip-wrapper">
                                <button
                                    className="edit-button"
                                    disabled
                                >
                                    Edit Profile
                                </button>
                                <span className="tooltip-text">Edit profile feature coming soon!</span>
                            </span>
                            <button
                                className="delete-button"
                                onClick={() => setShowConfirmDelete(true)}
                            >
                                Delete Account
                            </button>
                        </>
                    ) : (
                        isLoggedIn &&
                        !isGuest && 
                        profileData.status !== "DELETED" && (
                            <button className="create-room-button" onClick={handleSendFriendRequest}>
                                Send Friend Request
                            </button>
                        )
                    )}
                </div>

                {isOwnProfile && (
                    <div className="scroll-section">
                        <h2>Friend Requests Received</h2>
                        {friendRequestsReceived.length > 0 ? (
                            <ul className="scroll-list">
                                {friendRequestsReceived.map((potentialFriend) => (
                                    <li key={potentialFriend["id"]} className="scroll-item friend-request-item">
                                        {potentialFriend["username"]} {"("}
                                        <Link
                                            to={`/profile/${potentialFriend["username"]}`}
                                            className="friend-link"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            see profile
                                        </Link>
                                        {")"}
                                        <div className="friend-request-actions">
                                            <button
                                                className="accept-button"
                                                onClick={() => handleAcceptFriend(potentialFriend["username"])}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                className="reject-button"
                                                onClick={() => handleRejectFriend(potentialFriend["username"])}
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
                    {friendsList.length > 0 ? (
                        <ul className="scroll-list">
                            {friendsList.map((friend) => (
                                <li key={friend["id"]} className="scroll-item">
                                    <Link
                                        to={`/profile/${friend["username"]}`}
                                        className="friend-link"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {friend["username"]}
                                    </Link>
                                    {" "}
                                    {isOwnProfile && (
                                        <button
                                            className="remove-friend-button"
                                            onClick={() => handleRemoveFriend(friend["username"])}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-results">No friends yet.</p>
                    )}
                </div>

                <div className="scroll-section">
                    <h2>Past Games</h2>
                    {profileData.past_games?.length > 0 ? (
                        <ul className="scroll-list">
                            {profileData.past_games.map((game) => (
                                <li key={game._id} className="scroll-item">
                                    <span className="tooltip-wrapper">
                                        <Link
                                            to={`/game/${game._id}`}
                                            className="friend-link"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            tabIndex={-1}
                                            style={{ pointerEvents: "none", color: "#aaa", cursor: "not-allowed" }}
                                            aria-disabled="true"
                                        >
                                            Game ID: {game._id}
                                        </Link>
                                        <span className="tooltip-text">Game analysis coming soon!</span>
                                    </span>
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