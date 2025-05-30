import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
    BoardPage,
    HomePage,
    ProtectedRoute,
    CreateRoomPage,
    JoinRoomPage,
    ResetPasswordPage,
    SignInPage,
    CreateAccountPage,
    UserMenu
} from "./components";
import { SocketProvider } from "./socket";

const App = () => {
    return (
        <Router>
            <SocketProvider>
                <UserMenu />
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
                </Routes>
            </SocketProvider>
        </Router>
    );
}

export default App;