import { BoardPage } from "./components";
import { SocketProvider } from "./socket";

const App = () => {
    return (
        <SocketProvider>
            <BoardPage />
        </SocketProvider>
    );
}

export default App;
