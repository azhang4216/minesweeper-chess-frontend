import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { actions } from "../../redux";
import { loginUser } from '../../api';
import './style.css';

const SignInPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [identifier, setIdentifier] = useState(''); // can be username or email
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!identifier || !password) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            const data = await loginUser(identifier, password);
            dispatch(actions.logIn(data.user.username));
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="front-page">
            <img src="/landmine_white.png" alt="Landmine Chess Logo" className="logo" />

            <div className="join-create-room-container">
                <h2 className="sign-in-title">Sign In</h2>
                <form onSubmit={handleSubmit} className="sign-in-form">
                    <input
                        type="text"
                        placeholder="Username or Email"
                        className="room-input"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="room-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <div className="room-message">{error}</div>}
                    <button type="submit" className="sign-in-button">Sign In</button>
                </form>
                <p className="create-account-text">
                    Don't have an account?{' '}
                    <span className="create-account-link" onClick={() => navigate('/create-account')}>
                        Create one
                    </span>
                </p>
            </div>
        </div>
    );
};

export default SignInPage;
