import { useState } from 'react';
import { resendVerificationEmail } from '../../api';
import './style.css';

const ResendVerification = () => {
    const [error, setError] = useState('');
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [resentVerificationEmail, setResentVerificationEmail] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usernameOrEmail) {
            setError("Please enter your username or email to resend a verification email.");
        }
        try {
            await resendVerificationEmail(usernameOrEmail);
            setResentVerificationEmail(true);
            setError("");
        } catch (err) {
            setError(err.message || 'Failed to resend verification email. Please try again later.');
        }
    }

    return (
        <div className="resend-verification-email-page">
            <img src="/landmine_white.png" alt="Landmine Chess Logo" className="logo" />
            <div className="resend-verification-email-container">
                <h2 className="resend-title">Resend Verification Email</h2>
                <p className="resend-description">Enter your username or email to receive a new verification link.</p>
                <form onSubmit={handleSubmit} className="resend-form">
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
