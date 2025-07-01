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
    ProfilePage
} from "./components";
import { SocketProvider } from "./socket";

// Wrapper to access location inside Router
const AppContent = () => {
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
        /^\/profile\/[^/]+$/           // Profile pages like /profile/username
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
                <Route path="/profile/:id" element={<ProfilePage />} />
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
