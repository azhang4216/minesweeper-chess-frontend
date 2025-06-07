import { useState, useEffect } from 'react';
import axios from 'axios';
import './style.css';
// import { useNavigate } from "react-router-dom";
import API_BASE_URL from '../../config';

const ResetPasswordPage = () => {
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');
    // const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setToken(params.get('token'));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirm) {
            setMessage("Passwords do not match.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/reset-password`, {
                token,
                password,
            });

            if (response.status === 200) {
                setMessage("Password has been reset successfully.");
            } else {
                setMessage("Failed to reset password.");
            }
        } catch (error) {
            setMessage("Error: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="reset-password-page">
            {/* <button
                onClick={() => navigate("/")}
                className="back-button"
            >
                ← Back to Home
            </button> */}
            <div className="reset-container">
                <h2 className="reset-title">Reset Your Password</h2>
                <form className="reset-form" onSubmit={handleSubmit}>
                    <label className="reset-label">New Password:</label>
                    <input
                        type="password"
                        className="reset-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <label className="reset-label">Confirm Password:</label>
                    <input
                        type="password"
                        className="reset-input"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />

                    <button className="reset-button" type="submit">Reset Password</button>
                </form>
                {message && <p className="reset-message">{message}</p>}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
