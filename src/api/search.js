import axios from './axiosInstance';

export const findUsersByInputString = async (inputStr) => {
    try {
        const response = await axios.post('/api/search', { inputStr });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.error || `Failed to search for users with ${inputStr}`);
    }
}

export const getUsernameById = async (id) => {
    const res = await axios.get(`api/search/${id}`);
    console.log(`getUsernameById Res: ${res}`);
    return res.data;
};