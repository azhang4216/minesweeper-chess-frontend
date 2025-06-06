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
    const goToPlay = () => navigate('/play');
    const goToProfile = () => navigate('/profile');
    const goToSearch = () => navigate('/search');

    return (
        <div className={`sidebar ${expanded ? 'expanded' : ''}`} onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
            <div className="sidebar-item" onClick={goHome}>
                <img src="/landmine_logo.png" alt="Home" className="sidebar-logo" />
                {expanded && <span className="sidebar-label">Home</span>}
            </div>
            <div className="sidebar-buttons">
                <div className="sidebar-item" onClick={goToPlay}>
                    <span className="sidebar-icon">🎮</span>
                    {expanded && <span className="sidebar-label">Play Game</span>}
                </div>
                {isLoggedIn && !isGuest && (
                    <div className="sidebar-item" onClick={goToProfile}>
                        <span className="sidebar-icon">👤</span>
                        {expanded && <span className="sidebar-label">Profile</span>}
                    </div>
                )}
                <div className="sidebar-item" onClick={goToSearch}>
                    <span className="sidebar-icon">🔍</span>
                    {expanded && <span className="sidebar-label">Search</span>}
                </div>
            </div>
        </div>
    );
};

export default NavigationSidebar;
