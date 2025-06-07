import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsLoggedIn, useIsPlayingAsGuest } from '../../hooks';
import './style.css';

const NavigationSidebar = () => {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();

    const isLoggedIn = useIsLoggedIn();
    const isGuest = useIsPlayingAsGuest();

    const goHome = () => navigate('/');
    const goToProfile = () => navigate('/profile');
    const goToSearch = () => navigate('/search');
    const goToPlay = () => {
        if (isLoggedIn || isGuest) {
            // signed in & guests -> join game page
            navigate('/join-room');
        } else {
            // not signed in -> sign in page
            navigate('/sign-in');
        }
    };

    return (
        <div
            className={`sidebar ${expanded ? 'expanded' : ''}`}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            <div className="sidebar-buttons">
                <div className="sidebar-item" onClick={goHome}>
                    <div className="sidebar-content">
                        <span className="sidebar-icon">
                            <img src="/landmine_logo.png" alt="Home" className="sidebar-logo" />
                        </span>
                        {expanded && <span className="sidebar-label">Home</span>}
                    </div>
                </div>
                <div className="sidebar-item" onClick={goToPlay}>
                    <div className="sidebar-content">
                        <span className="sidebar-icon">♟️</span>
                        {expanded && <span className="sidebar-label">Play Game</span>}
                    </div>
                </div>
                {isLoggedIn && !isGuest && (
                    <div className="sidebar-item" onClick={goToProfile}>
                        <div className="sidebar-content">
                            <span className="sidebar-icon">👤</span>
                            {expanded && <span className="sidebar-label">Profile</span>}
                        </div>
                    </div>
                )}
                <div className="sidebar-item" onClick={goToSearch}>
                    <div className="sidebar-content">
                        <span className="sidebar-icon">🔍</span>
                        {expanded && <span className="sidebar-label">Search User</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationSidebar;
