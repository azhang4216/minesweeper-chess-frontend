import { createContext, useContext } from "react";
import socket from "./socket";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);