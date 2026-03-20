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
    const [playOpen, setPlayOpen]   = useState(false);
    const [userOpen, setUserOpen]   = useState(false);
    const playRef = useRef(null);
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
            if (playRef.current && !playRef.current.contains(e.target)) setPlayOpen(false);
            if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close dropdowns on route change
    useEffect(() => {
        setPlayOpen(false);
        setUserOpen(false);
    }, [location.pathname]);

    const isActive = (path) => location.pathname === path;

    const go = (path) => () => navigate(path);

    const handlePlayAsGuest = async () => {
        try {
            const guestId = await generateGuestUUID();
            dispatch(actions.playAsGuest(guestId));
            socket.emit('authenticate', { playerId: guestId });
        } catch (e) {
            console.error('Failed to generate guest UUID:', e);
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

                {/* Play dropdown */}
                <div className="nav-dropdown-wrap" ref={playRef}>
                    <button
                        className={`nav-link nav-link--chevron${playOpen ? ' nav-link--active' : ''}`}
                        onClick={() => setPlayOpen(v => !v)}
                        disabled={!isLoggedIn && !isGuest}
                        title={!isLoggedIn && !isGuest ? 'Sign in to play' : undefined}
                    >
                        Play
                        <span className={`nav-chevron${playOpen ? ' open' : ''}`}>▾</span>
                    </button>
                    {playOpen && (
                        <div className="nav-dropdown">
                            <button className="nav-dropdown-item" onClick={go('/create-room')}>
                                <span className="nav-dropdown-icon">🏠</span>
                                <span>
                                    <strong>Create Room</strong>
                                    <small>Host a private game</small>
                                </span>
                            </button>
                            <div className="nav-dropdown-divider" />
                            <button className="nav-dropdown-item" onClick={go('/join-room')}>
                                <span className="nav-dropdown-icon">🔍</span>
                                <span>
                                    <strong>Join Room</strong>
                                    <small>Browse open games</small>
                                </span>
                            </button>
                        </div>
                    )}
                </div>

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
