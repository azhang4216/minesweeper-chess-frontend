import axios from './axiosInstance';

export async function findUsersByInputString(inputStr) {
    try {
        const response = await axios.post('/api/search', { inputStr });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.error || `Failed to search for users with ${inputStr}`);
    }
}