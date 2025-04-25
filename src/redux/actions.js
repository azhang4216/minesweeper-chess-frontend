export const updateGameFromServer = (gameFen, moveSan, temporaryUpdate=false) => ({
    type: "UPDATE_GAME",
    payload: {
        gameFen,
        moveSan,
        temporaryUpdate,
    },
});

export const placeBomb = (square) => ({
    type: "PLACE_BOMB",
    payload: square,
});

export const detonateBomb = (square) => ({
    type: "DETONATE_BOMB",
    payload: square,
});

export const setGameFen = (fen) => ({
    type: "SET_GAME_FEN",
    payload: fen,
});

export const setGameState = (gameState) => ({
    type: "SET_GAME_STATE",
    payload: gameState,
});

export const setPlayerInfo = (player) => ({
    type: "SET_PLAYER_INFO",
    payload: player,
});

export const setOpponentInfo = (opponent) => ({
    type: "SET_OPPONENT_INFO",
    payload: opponent,
});

export const setOrientation = (isWhite) => ({
    type: "SET_ORIENTATION",
    payload: isWhite,
});

export const setPlacingBombSeconds = (placingBombSeconds) => ({
    type: "SET_PLACING_BOMBS_SECONDS",
    payload: placingBombSeconds,
});

export const setRandomizedBombs = ({ whitePlayerBombs, blackPlayerBombs }) => ({
    type: "SET_RANDOMIZED_BOMBS",
    payload: { whitePlayerBombs, blackPlayerBombs },
});

export const setTimers = ({ whiteTimeLeft, blackTimeLeft }) => ({
    type: "SET_TIMERS",
    payload: { whiteTimeLeft, blackTimeLeft },
});
