import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import {
    BoardPage,
    HomePage,
    ProtectedGameRoute,
    ProtectedLoginRoute,
    CreateRoomPage,
    JoinRoomPage,
    ResetPasswordPage,
    SignInPage,
    CreateAccountPage,
    UserMenu,
    ConfirmAccountPage,
    NavigationSideBar,
    NotFoundPage,
    ProfilePage,
    SearchPage
} from "./components";
import { SocketProvider } from "./socket";
import { useInitializeSocket, useAuthState } from "./hooks";

// Wrapper to access location inside Router
const AppContent = () => {
    useInitializeSocket();
    useAuthState();                    // Allows for authentication on refresh

    const location = useLocation();

    // Regular expressions for valid paths
    const validPaths = [
        /^\/$/,                        // Home
        /^\/create-room$/,             // Create room
        /^\/join-room$/,               // Join room
        /^\/play-game$/,               // Game
        /^\/sign-in$/,                 // Sign in
        /^\/reset-password$/,          // Reset password
        /^\/create-account$/,          // Create account
        /^\/verify-email$/,            // Email verification
        /^\/profile\/[^/]+$/,          // Profile pages like /profile/username
        /^\/search-user$/,             // Search for users
    ];

    const isNotFound = !validPaths.some((pattern) => pattern.test(location.pathname));

    return (
        <>
            {!isNotFound && <UserMenu />}
            <NavigationSideBar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create-room" element={
                    <ProtectedLoginRoute>
                        <CreateRoomPage />
                    </ProtectedLoginRoute>
                } />
                <Route path="/join-room" element={
                    <ProtectedLoginRoute>
                        <JoinRoomPage />
                    </ProtectedLoginRoute>
                } />
                <Route path="/play-game" element={
                    <ProtectedGameRoute>
                        <BoardPage />
                    </ProtectedGameRoute>
                } />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/create-account" element={<CreateAccountPage />} />
                <Route path="/verify-email" element={<ConfirmAccountPage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </>
    );
};

const App = () => {
    return (
        <Router>
            <SocketProvider>
                <AppContent />
            </SocketProvider>
        </Router>
    );
};

export default App;
