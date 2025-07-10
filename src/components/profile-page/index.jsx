import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
    useUsername,
    useIsPlayingAsGuest,
    useIsLoggedIn
} from "../../hooks";
import { getUserProfile } from "../../api";
import "./style.css";

const ProfilePage = () => {
    const { username } = useParams(); // :username from URL
    const currentUsername = useUsername();
    const isGuest = useIsPlayingAsGuest();
    const isLoggedIn = useIsLoggedIn();

    const [userData, setUserData] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);

    const isOwnProfile = userData && currentUsername && userData.username === currentUsername;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const data = await getUserProfile(username);
                setUserData(data);
                setNotFound(false);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setNotFound(true);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [username]);

    if (loading) return <div>Loading profile...</div>;
    if (notFound) return <div>User not found.</div>;
    if (!userData) return <div>Something went wrong.</div>;

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Username: {userData.username}</h1>

            <div style={{ margin: "1.5rem 0" }}>
                <h2>Friends</h2>
                {userData.friends && userData.friends.length > 0 ? (
                    <ul>
                        {userData.friends.map(friend => (
                            <li key={friend._id}>
                                <Link to={`/profile/${friend._id}`}>
                                    {friend.username}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No friends yet.</p>
                )}
            </div>

            {isOwnProfile ? (
                <div>
                    <button>Delete Account</button>
                    <button>Edit Profile</button>
                    {/* Add more self-only actions */}
                </div>
            ) : (
                isLoggedIn && !isGuest && (
                    <div>
                        <button>Send Friend Request</button>
                        {/* Add mutual actions */}
                    </div>
                )
            )}
        </div>
    );
};

export default ProfilePage;
