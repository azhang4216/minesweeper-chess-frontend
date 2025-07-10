import axios from './axiosInstance';

export const getUserProfile = async (username) => {
    const res = await axios.get(`/api/profile/${username}`);
    return res.data;
};

export const addFriend = async (username, friendUsername) => {
    const res = await axios.post(`/api/profile/${username}/add-friend`, { friendUsername });
    return res.data;
};

export const acceptFriend = async (username, friendUsername) => {
    const res = await axios.post(`api/profile/${username}/accept-friend`, { friendUsername });
    return res.data;
}

export const deleteAccount = async (userId) => {
    const res = await axios.delete(`/api/profile/${userId}`);
    return res.data;
};
