import axios from './axiosInstance';

export const getUserProfile = async (username) => {
    const res = await axios.get(`/api/profile/${username}`);
    return res.data;
};

export const addFriend = async (userId, friendId) => {
    const res = await axios.post(`/api/profile/${userId}/add-friend`, { friendId });
    return res.data;
};

export const deleteAccount = async (userId) => {
    const res = await axios.delete(`/api/profile/${userId}`);
    return res.data;
};
