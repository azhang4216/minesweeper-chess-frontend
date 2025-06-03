import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAccount } from '../../api';
import './style.css';

const ConfirmAccount = () => {
    const navigate = useNavigate();

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const verifiedOnce = useRef(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get('token');

        if (!token) {
            setError('Verification token missing.');
            return;
        }

        const confirm = async () => {
            try {
                await verifyAccount(token);
                setMessage('Account successfully verified!');
                verifiedOnce.current = true;
                setError('');
            } catch (err) {
                if (!verifiedOnce.current) {
                    setError(err.message || 'Verification failed.');
                }
            }
        };

        confirm();
    }, []);

    return (
        <div className="confirm-account-page">
            <img src="/landmine_white.png" alt="Landmine Chess Logo" className="logo" />
            <div className="confirm-account-container">
                <h2 className="confirm-account-title">Confirming Your Account</h2>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                {verifiedOnce.current && (
                    <p className="create-account-text">
                        Ready to log in with your new account?{' '}
                        <span className="create-account-link" onClick={() => navigate('/sign-in')}>
                            Go to Login
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
};

export default ConfirmAccount;
