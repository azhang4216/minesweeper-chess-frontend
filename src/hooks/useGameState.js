import { useSelector } from 'react-redux';

export const useGameFen = () => {
    return useSelector((state) => state.game.gameFen);
};

export const useIsWhite = () => {
    return useSelector((state) => state.game.isWhite);
};

export const useIsMyTurn = () => {
    return useSelector((state) => state.game.isMyTurn);
};

export const usePlacingBombs = () => {
    return useSelector((state) => state.game.placingBombs);
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

// could also add a hook that returns multiple related values
// export const useGameStatus = () => {
//   return useSelector((state) => ({
//     isWhite: state.game.isWhite,
//     isMyTurn: state.game.isMyTurn,
//     placingBombs: state.game.placingBombs
//   }));
// };