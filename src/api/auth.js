import axios from './axiosInstance';

export async function loginUser(identifier, password) {
    try {
        const response = await axios.post('/api/login', { identifier, password });

        const { token } = response.data;
        if (token) {
            localStorage.setItem('token', token);
            console.log('Set token in local storage');
        } else {
            console.log('Failed to obtain a token');
        }

        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.error || 'Login failed');
    }
}

export async function logoutUser() {
    try {
        const response = await axios.post('/api/logout');
        localStorage.removeItem('token');
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Logout failed');
    }
}

export async function registerUser(email, username, password) {
    try {
        const response = await axios.post('/api/create-account', { email, username, password });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.error || 'Registration failed');
    }
}

export async function verifyAccount(token) {
    try {
        const response = await axios.get('/api/verify-email', { 
            params: { token }
        });
        return response.data;
    } catch (err) {
        const message = err.response?.data?.error || 'Verification failed';
        throw new Error(message);
    }
}

export async function requestPasswordReset(email) {
    try {
        const response = await axios.post('/api/reset-password-request', { email });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Password reset request failed');
    }
}

export async function resetPassword(token, newPassword) {
    try {
        const response = await axios.post('/api/reset-password', { token, newPassword });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Password reset failed');
    }
}

export async function generateGuestUUID() {
    try {
        const response = await axios.get('/api/guest-uuid');
        return response.data?.guestUUID;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to get unique UUID for guest player');
    }
}
