import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { actions } from "../../redux";
import {
    useUsername,
    useIsLoggedIn,
    useIsPlayingAsGuest
} from '../../hooks';
import { generateGuestUUID } from "../../utils";
import './style.css';

const UserMenu = () => {
    const username = useUsername();
    const isGuest = useIsPlayingAsGuest();
    const isLoggedIn = useIsLoggedIn();
    console.log({ username, isGuest, isLoggedIn });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
    const closeDropdown = () => setDropdownOpen(false);

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
        console.log("logged out");
        closeDropdown();
    };
    const handlePlayAsGuest = async () => {
        try {
            const assignedGuestID = await generateGuestUUID();
            console.log(`Got assigned guest ID: ${assignedGuestID}`);
            dispatch(actions.playAsGuest(assignedGuestID));
        } catch (e) {
            console.error("Failed to generate guest UUID:", e);
        } finally {
            closeDropdown();
        }
    };

    const renderDropdown = () => {
        if (!isLoggedIn) {
            // this person hasn't selected who to play as!
            return (
                <div className="user-dropdown">
                    <button onClick={handleSignIn}>Sign In</button>
                    <button onClick={handleCreateAccount}>Create Account</button>
                    <button onClick={handlePlayAsGuest}>Play as Guest</button>
                </div>
            );
        } else if (!isGuest) {
            // this user has logged into their account
            return (
                <div className="user-dropdown">
                    <button onClick={handleProfile}>Profile</button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            );
        }

        // this user is playing as a guest
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
        return 'Select Option';
    };

    return (
        <div className="user-menu" tabIndex={0}>
            <button className="user-menu-button" onClick={toggleDropdown}>
                {renderLabel()} ▾
            </button>
            {dropdownOpen && renderDropdown()}
        </div>
    );
};

export default UserMenu;
