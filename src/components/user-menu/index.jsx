import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { actions } from "../../redux";
import {
    useUsername,
    useIsLoggedIn,
    useIsPlayingAsGuest
} from '../../hooks';
import { generateGuestUUID } from "../../api";
import './style.css';

const UserMenu = () => {
    const username = useUsername();
    const isGuest = useIsPlayingAsGuest();
    const isLoggedIn = useIsLoggedIn();

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const menuRef = useRef(null);  // Ref for the user menu div

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
    const closeDropdown = () => setDropdownOpen(false);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                closeDropdown();
            }
        }

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const handleSignIn = () => {
        navigate('/sign-in');
        closeDropdown();
    };
    const handleCreateAccount = () => {
        navigate('/create-account');
        closeDropdown();
    };
    const handleProfile = () => {
        navigate('/profile');
        closeDropdown();
    };
    const handleLogout = () => {
        dispatch(actions.logOut());
        closeDropdown();
    };
    const handlePlayAsGuest = async () => {
        try {
            const assignedGuestID = await generateGuestUUID();
            dispatch(actions.playAsGuest(assignedGuestID));
        } catch (e) {
            console.error("Failed to generate guest UUID:", e);
        } finally {
            closeDropdown();
        }
    };

    const renderDropdown = () => {
        if (!isLoggedIn) {
            return (
                <div className="user-dropdown">
                    <button onClick={handleSignIn}>Sign In</button>
                    <button onClick={handleCreateAccount}>Create Account</button>
                    <button onClick={handlePlayAsGuest}>Play as Guest</button>
                </div>
            );
        } else if (!isGuest) {
            return (
                <div className="user-dropdown">
                    <button onClick={handleProfile}>Profile</button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            );
        }
        return (
            <div className="user-dropdown">
                <button onClick={handleSignIn}>Sign In</button>
                <button onClick={handleCreateAccount}>Create Account</button>
            </div>
        );
    };

    const renderLabel = () => {
        if (isLoggedIn && !isGuest) return username;
        if (isLoggedIn && isGuest) return 'Guest';
        return 'Login / Sign in';
    };

    return (
        <div className="user-menu" ref={menuRef} tabIndex={0}>
            <button className="user-menu-button" onClick={toggleDropdown}>
                {renderLabel()} ▾
            </button>
            {dropdownOpen && renderDropdown()}
        </div>
    );
};

export default UserMenu;
