import API_BASE_URL from "../config";

const responseIsSuccessful = (status) => {
    return 200 <= status && status < 300;
}

export async function loginUser(email, password) {
    const response = await fetch(`http://${API_BASE_URL}/api/login`, {
        method: 'POST',
        credentials: 'include', // send cookies
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (!responseIsSuccessful(response.status)) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    return data; // usually contains user info or a success flag
}

export async function logoutUser() {
    const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
    });

    if (!responseIsSuccessful(response.status)) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
    }
    return await response.json();
}

export async function registerUser(email, username, password) {
    console.log(`Trying to register a new user...${email}, ${username}, ${password}`);
    const response = await fetch(`${API_BASE_URL}/api/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
    });

    const responseJson = await response.json();

    if (!responseIsSuccessful(response.status)) {
        throw new Error(responseJson.error || 'Registration failed');
    }

    return responseJson;
}

export async function verifyAccount(token) {
    // Assuming you send a token for verification (from email link)
    const response = await fetch(`${API_BASE_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });

    if (!responseIsSuccessful(response.status)) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
    }
    return await response.json();
}

export async function requestPasswordReset(email) {
    const response = await fetch(`${API_BASE_URL}/api/reset-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!responseIsSuccessful(response.status)) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset request failed');
    }
    return await response.json();
}

export async function resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
    });

    if (!responseIsSuccessful(response.status)) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
    }
    return await response.json();
}

export async function generateGuestUUID() {
    const response = await fetch(`${API_BASE_URL}/api/guest-uuid`, {
        method: 'GET'
    });

    if (!responseIsSuccessful(response.status)) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get unique UUID for guest player');
    }
    
    const responseJSON = await response.json();
    return responseJSON?.guestUUID;
}
