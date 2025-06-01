import { useSelector } from 'react-redux';

// note: need these extra checks because when page first loads,
//       the reducer hasn't finished loading yet
export const useUsername = () => {
    return useSelector((state) => state.game.player?.name || '');
};

export const useIsLoggedIn = () => {
    return useSelector((state) => state.game.loggedIn || false);
};

export const useIsPlayingAsGuest = () => {
    return useSelector((state) => state.game.playingAsGuest || false);
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
