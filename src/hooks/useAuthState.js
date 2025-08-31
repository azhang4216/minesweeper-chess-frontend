import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../redux';
import { validateToken } from '../api/auth';
import { useEffect } from 'react';
import { useSocket } from '../socket';

// note: need these extra checks because when page first loads,
//       the reducer hasn't finished loading yet
export const useUsername = () => {
    // return useSelector((state) => state.game?.player?.name || '');
    return useSelector((state) => state.username || "");
};

export const useIsLoggedIn = () => {
    return useSelector((state) => state.loggedIn || false);
};

export const useIsPlayingAsGuest = () => {
    return useSelector((state) => state.playingAsGuest || false);
};

export const useIsAuthLoading = () => {
    return useSelector((state) => state.isAuthLoading || false);
}

export const useAuthState = () => {
    const dispatch = useDispatch();
    const socket = useSocket();

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        console.log(`JWT found in localstorage on load: ${token}`);

        if (token) {
            dispatch(actions.setIsAuthLoading(true));

            validateToken(token).then((user) => {
                if (user) {
                    dispatch(actions.logIn(user.username));
                    socket.emit("authenticate", { playerId: user.username });
                } else {
                    localStorage.removeItem("authToken");
                    dispatch(actions.logOut());
                }

                // stop loading when finished
                dispatch(actions.setIsAuthLoading(false));
            });
        } else {
            // no token, not loading
            dispatch(actions.setIsAuthLoading(false));
        }
    }, [dispatch]);
};

// import { useState } from "react";
// import { useDispatch } from "react-redux";
// import { actions } from "../redux";

// export const useAuth = () => {
//     const dispatch = useDispatch();
//     // const [user, setUser] = useState(() => {
//     //     try {
//     //         return JSON.parse(localStorage.getItem("user")) || null;
//     //     } catch {
//     //         localStorage.removeItem("user"); // clear bad data
//     //         return null;
//     //     }
//     // });

//     const login = (userData) => {
//         if (userData) {
//             console.log(`setting user data in local storage: ${userData}`);
//             localStorage.setItem("user", JSON.stringify(userData));
//             // setUser(userData);

//             dispatch(actions.setUsername(userData.username));
//         } else {
//             // If userData is null or undefined, clear storage and state
//             console.log("null user data, so we remove stored user...");
//             localStorage.removeItem("user");
//             // setUser(null);
//         }
//     };

//     const logout = () => {
//         localStorage.removeItem("user");
//         // setUser(null);
//     };

//     return { login, logout };
// };
