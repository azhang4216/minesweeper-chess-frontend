import { useSelector } from 'react-redux';
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";

export const useGameFen = () => {
    return useSelector((state) => state.game.gameFen);
};

export const useIsWhite = () => {
    return useSelector((state) => state.game.isWhite);
};

export const useIsMyTurn = () => {
    return useSelector((state) => (state.game.moveHistory.length % 2 === 0) === state.game.isWhite);
};

export const useMoveHistory = () => {
    return useSelector((state) => state.game.moveHistory);
};

export const usePlayer = () => {
    return useSelector((state) => state.game.player);
};

export const useOpponent = () => {
    return useSelector((state) => state.game.opponent);
};

export const useMyBombs = () => {
    return useSelector((state) => state.game.player.bombs);
};

export const useMyTimeLeft = () => {
    return useSelector((state) => state.game.player.secondsLeft);
}

export const useOpponentTimeLeft = () => {
    return useSelector((state) => state.game.opponent.secondsLeft);
}

export const useBombPlantingTime = () => {
    return useSelector((state) => state.game.placingBombsSeconds);
}

export const useGameState = () => {
    return useSelector((state) => state.game.gameState);
}

// export const usePrompt = (when, message) => {
//     const navigate = useNavigate();

//     useEffect(() => {
//         if (!when) return;

//         // Handle navigation blocking
//         const handleBeforeUnload = (e) => {
//             if (when) {
//                 e.preventDefault();
//                 e.returnValue = message;  // Display the custom message
//             }
//         };

//         // Attach the event listener to block navigation
//         window.addEventListener("beforeunload", handleBeforeUnload);

//         // Cleanup event listener when the component is unmounted or when `when` is false
//         return () => {
//             window.removeEventListener("beforeunload", handleBeforeUnload);
//         };
//     }, [when, message, navigate]);
// }


// could also add a hook that returns multiple related values
// export const useGameStatus = () => {
//   return useSelector((state) => ({
//     isWhite: state.game.isWhite,
//     isMyTurn: state.game.isMyTurn,
//     placingBombs: state.game.placingBombs
//   }));
// };