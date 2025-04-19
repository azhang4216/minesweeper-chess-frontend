import BoardPage from "./components/BoardPage";
import { SocketProvider } from "./socketContext.js";

const App = () => {
    return (
        <SocketProvider>
            <BoardPage />
        </SocketProvider>
    );
}

export default App;
