import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
    BoardPage,
    HomePage,
    ProtectedRoute,
    CreateRoomPage,
    JoinRoomPage,
    ResetPasswordPage
} from "./components";
import { SocketProvider } from "./socket";

const App = () => {
    return (
        <SocketProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/create-room" element={<CreateRoomPage />} />
                    <Route path="/join-room" element={<JoinRoomPage />} />
                    <Route path="/play-game" element={
                        <ProtectedRoute>
                            <BoardPage />
                        </ProtectedRoute>
                    }/>
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Routes>
            </Router>
        </SocketProvider>
    );
}

export default App;