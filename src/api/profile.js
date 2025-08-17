import axios from './axiosInstance';

const DEBUG = false; // toggle for debugging
const getFullEndpoint = (path) => `${axios.defaults.baseURL}${path}`;

const debugLog = (msg) => {
    if (DEBUG) {
        console.log(msg);
    }
};

// Get user profile by username
export const getUserProfileByUsername = async (username) => {
    const endpoint = getFullEndpoint('/api/profile/get-profile');
    debugLog(`[API] POST ${endpoint}`, { username });
    const res = await axios.post(`/api/profile/get-profile`, { username });
    return res.data;
};

// Send a friend request
export const sendFriendRequest = async (requesteeUsername, requesterUsername) => {
    const endpoint = getFullEndpoint('/api/profile/send-friend-request');
    debugLog(`[API] POST ${endpoint}`, { requesteeUsername, requesterUsername });
    const res = await axios.post(`/api/profile/send-friend-request`, { requesteeUsername, requesterUsername });
    return res.data;
};

// Accept a friend request
export const acceptFriendRequest = async (requesteeUsername, requesterUsername) => {
    const endpoint = getFullEndpoint('/api/profile/accept-friend-request');
    debugLog(`[API] POST ${endpoint}`, { requesteeUsername, requesterUsername });
    const res = await axios.post(`/api/profile/accept-friend-request`, { requesteeUsername, requesterUsername });
    return res.data;
};

// Reject a friend request
export const rejectFriendRequest = async (requesteeUsername, requesterUsername) => {
    const endpoint = getFullEndpoint('/api/profile/reject-friend-request');
    debugLog(`[API] POST ${endpoint}`, { requesteeUsername, requesterUsername });
    const res = await axios.post(`/api/profile/reject-friend-request`, { requesteeUsername, requesterUsername });
    return res.data;
};

// Remove a friend
export const removeFriend = async (requesteeUsername, requesterUsername) => {
    const endpoint = getFullEndpoint('/api/profile/remove-friend');
    debugLog(`[API] POST ${endpoint}`, { requesteeUsername, requesterUsername });
    const res = await axios.post(`/api/profile/remove-friend`, { requesteeUsername, requesterUsername });
    return res.data;
};

// Delete account
export const deleteAccount = async (requesterUsername) => {
    const endpoint = getFullEndpoint('/api/profile/delete-account');
    debugLog(`[API] POST ${endpoint}`, { requesterUsername });
    const res = await axios.post(`/api/profile/delete-account`, { requesterUsername });
    return res.data;
};