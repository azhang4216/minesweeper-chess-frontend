import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import {
    BoardPage,
    HomePage,
    ProtectedRoute,
    CreateRoomPage,
    JoinRoomPage,
    ResetPasswordPage,
    SignInPage,
    CreateAccountPage,
    UserMenu,
    ConfirmAccountPage,
    NavigationSideBar,
    NotFoundPage
} from "./components";
import { SocketProvider } from "./socket";

// This wrapper lets us access useLocation inside Router
const AppContent = () => {
    const location = useLocation();

    // Define known paths
    const knownPaths = new Set([
        '/',
        '/create-room',
        '/join-room',
        '/play-game',
        '/sign-in',
        '/reset-password',
        '/create-account',
        '/verify-email',
    ]);

    const isNotFound = !knownPaths.has(location.pathname);

    return (
        <>
            {!isNotFound && <UserMenu />}
            <NavigationSideBar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create-room" element={<CreateRoomPage />} />
                <Route path="/join-room" element={<JoinRoomPage />} />
                <Route path="/play-game" element={
                    <ProtectedRoute>
                        <BoardPage />
                    </ProtectedRoute>
                } />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/create-account" element={<CreateAccountPage />} />
                <Route path="/verify-email" element={<ConfirmAccountPage />} />
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
