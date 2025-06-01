import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../utils';
import { useDispatch } from "react-redux";
import { actions } from "../../redux";
import './style.css';

const CreateAccountPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        
        try {
            await registerUser(email, username, password);
            dispatch(actions.logIn(username));
            navigate('/');
        } catch (err) {
            console.log(`${err}`);
            setError(err.message);
            return;
        }
    };

    return (
        <div className="create-account-page">
            <img src="/landmine_white.png" alt="Landmine Chess Logo" className="logo" />

            <div className="create-account-container">
                <h2 className="create-account-title">Create Account</h2>
                <form onSubmit={handleSubmit} className="create-account-form">
                    <p className="field-note">This will be your public display name.</p>
                    <input
                        type="text"
                        placeholder="Username"
                        className="input-field"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        className="input-field"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="input-field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className="input-field"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="create-account-button">Create Account</button>
                </form>
                <p className="sign-in-text">
                    Already have an account?{' '}
                    <span className="sign-in-link" onClick={() => navigate('/sign-in')}>
                        Sign in
                    </span>
                </p>
            </div>
        </div>
    );
};

export default CreateAccountPage;
