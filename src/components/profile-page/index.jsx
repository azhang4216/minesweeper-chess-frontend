import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { 
    useUsername,
    useIsPlayingAsGuest,
    useIsLoggedIn
} from "../../hooks";

const ProfilePage = () => {
    const { id } = useParams(); // :id from URL
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
                const res = await axios.get(`/api/profile/${id}`);
                setUserData(res.data);
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
    }, [id]);

    if (loading) return <div>Loading profile...</div>;
    if (notFound) return <div>User not found.</div>;
    if (!userData) return <div>Something went wrong.</div>;

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Profile: {userData.username}</h1>
            <p>Email: {userData.email}</p>
            {/* Add more fields if needed */}

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
