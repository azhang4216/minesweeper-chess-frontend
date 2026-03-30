import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
    useIsLoggedIn,
    useIsPlayingAsGuest,
    useUsername
} from '../../hooks';
import { actions } from '../../redux';
import { generateGuestUUID } from '../../api';
import { useSocket } from '../../socket';
import './style.css';

const NavigationSideBar = () => {
    const [userOpen, setUserOpen]   = useState(false);
    const userRef = useRef(null);

    const navigate   = useNavigate();
    const location   = useLocation();
    const dispatch   = useDispatch();
    const socket     = useSocket();

    const isLoggedIn = useIsLoggedIn();
    const isGuest    = useIsPlayingAsGuest();
    const username   = useUsername();

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close dropdowns on route change
    useEffect(() => {
        setUserOpen(false);
    }, [location.pathname]);

    const isActive = (path) => location.pathname === path;

    const go = (path) => () => navigate(path);

    const handlePlayAsGuest = async () => {
        try {
            // Reuse existing guest ID so in-progress games survive navigation
            let guestId = localStorage.getItem('guestPlayerId');
            if (!guestId) {
                guestId = await generateGuestUUID();
                localStorage.setItem('guestPlayerId', guestId);
            }
            dispatch(actions.playAsGuest(guestId));
            socket.emit('authenticate', { playerId: guestId });
            navigate('/');
        } catch (e) {
            console.error('Failed to initialize guest session:', e);
        } finally {
            setUserOpen(false);
        }
    };

    const handleLogout = () => {
        dispatch(actions.logOut());
        setUserOpen(false);
        navigate('/');
    };

    const userLabel = isLoggedIn && !isGuest ? username
        : isGuest ? 'Guest'
        : 'Sign in';

    return (
        <nav className="topnav">
            {/* Brand */}
            <div className="topnav-brand" onClick={go('/')}>
                <img src="/landmine_logo.png" alt="Landmine Chess" className="topnav-logo" />
                <span className="topnav-wordmark">LANDMINE CHESS</span>
            </div>

            {/* Nav links */}
            <div className="topnav-links">
                <button
                    className={`nav-link${isActive('/') ? ' nav-link--active' : ''}`}
                    onClick={go('/')}
                >
                    Home
                </button>

                {/* Play — navigates to home where matchmaking lives */}
                <button
                    className="nav-link"
                    onClick={go('/')}
                >
                    Play
                </button>

                <button
                    className={`nav-link${isActive('/search') ? ' nav-link--active' : ''}`}
                    onClick={go('/search')}
                >
                    Search
                </button>

                {isLoggedIn && !isGuest && (
                    <button
                        className={`nav-link${isActive(`/profile/${username}`) ? ' nav-link--active' : ''}`}
                        onClick={go(`/profile/${username}`)}
                    >
                        Profile
                    </button>
                )}
            </div>

            {/* User menu */}
            <div className="nav-dropdown-wrap nav-user" ref={userRef}>
                <button
                    className={`nav-user-btn${userOpen ? ' open' : ''}`}
                    onClick={() => setUserOpen(v => !v)}
                >
                    <span className="nav-user-avatar">
                        {isLoggedIn ? (isGuest ? 'G' : username.charAt(0).toUpperCase()) : '?'}
                    </span>
                    <span className="nav-user-label">{userLabel}</span>
                    <span className={`nav-chevron${userOpen ? ' open' : ''}`}>▾</span>
                </button>

                {userOpen && (
                    <div className="nav-dropdown nav-dropdown--right">
                        {!isLoggedIn ? (
                            <>
                                <button className="nav-dropdown-item" onClick={() => { navigate('/sign-in'); setUserOpen(false); }}>
                                    <span className="nav-dropdown-icon">🔐</span>
                                    <span><strong>Sign In</strong></span>
                                </button>
                                <div className="nav-dropdown-divider" />
                                <button className="nav-dropdown-item" onClick={() => { navigate('/create-account'); setUserOpen(false); }}>
                                    <span className="nav-dropdown-icon">✨</span>
                                    <span><strong>Create Account</strong></span>
                                </button>
                                <div className="nav-dropdown-divider" />
                                <button className="nav-dropdown-item" onClick={handlePlayAsGuest}>
                                    <span className="nav-dropdown-icon">👾</span>
                                    <span><strong>Play as Guest</strong></span>
                                </button>
                            </>
                        ) : isGuest ? (
                            <>
                                <button className="nav-dropdown-item" onClick={() => { navigate('/sign-in'); setUserOpen(false); }}>
                                    <span className="nav-dropdown-icon">🔐</span>
                                    <span><strong>Sign In</strong></span>
                                </button>
                                <div className="nav-dropdown-divider" />
                                <button className="nav-dropdown-item" onClick={() => { navigate('/create-account'); setUserOpen(false); }}>
                                    <span className="nav-dropdown-icon">✨</span>
                                    <span><strong>Create Account</strong></span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="nav-dropdown-item" onClick={() => { navigate(`/profile/${username}`); setUserOpen(false); }}>
                                    <span className="nav-dropdown-icon">👤</span>
                                    <span><strong>Profile</strong></span>
                                </button>
                                <div className="nav-dropdown-divider" />
                                <button className="nav-dropdown-item nav-dropdown-item--danger" onClick={handleLogout}>
                                    <span className="nav-dropdown-icon">↩</span>
                                    <span><strong>Sign Out</strong></span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavigationSideBar;
