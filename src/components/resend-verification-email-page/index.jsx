import { useState } from 'react';
import { resendVerificationEmail } from '../../api';
import './style.css';

const ResendVerification = () => {
    const [error, setError] = useState('');
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [resentVerificationEmail, setResentVerificationEmail] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page refresh
        console.log(`handling submit form for ${usernameOrEmail}`);
        if (!usernameOrEmail) {
            setError("Please enter your username or email to resend a verification email.");
        }
        try {
            const res = await resendVerificationEmail(usernameOrEmail);
            console.log(res);
            setResentVerificationEmail(true);
            setError("");
        } catch (err) {
            setError(err.message || 'Failed to resend verification email. Please try again later.');
        }
    }

    return (
        <div className="resend-verification-email-page">
            <img src="/landmine_white.png" alt="Logo" className="logo" />
            <div className="resend-verification-email-container">
                <h2>Resend Verification Email</h2>
                <p>Enter your username or email to receive a new verification link.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username or Email"
                        value={usernameOrEmail}
                        onChange={e => setUsernameOrEmail(e.target.value)}
                        className="input-field"
                    />
                    <button type="submit" className="resend-verification-btn">
                        Resend Email
                    </button>
                </form>
                {error && <p className="error-message">{error}</p>}
                {resentVerificationEmail && (
                    <p className="success-message">Verification email sent. Check your inbox.</p>
                )}
            </div>
        </div>
    );
};

export default ResendVerification;
