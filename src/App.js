// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import {
//     BoardPage,
//     HomePage,
//     ProtectedRoute
// } from "./components";
// import { SocketProvider } from "./socket";

// const App = () => {
//     return (
//         // <SocketProvider>
//         //     <Router>
//         //         <Routes>
//         //             <Route path="/" element={<HomePage />} />
//         //             <Route path="/play-game" element={
//         //                 <ProtectedRoute>
//         //                     <BoardPage />
//         //                 </ProtectedRoute>
//         //             } />
//         //         </Routes>
//         //     </Router>
//         // </SocketProvider>
//     );
// }

// export default App;


import { BoardPage, HomePage } from "./components";
import { SocketProvider } from "./socket";
import { GAME_STATES } from "./constants";
import { useGameState } from "./hooks";

const App = () => {
    const gameState = useGameState();
    return (
        <SocketProvider>
            {(gameState === GAME_STATES.inactive || gameState === GAME_STATES.matching) ? <HomePage /> :
            <BoardPage />}
        </SocketProvider>
    );
}

export default App;