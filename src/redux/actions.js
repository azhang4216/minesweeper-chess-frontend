export const updateGameFromServer = (gameFen, moveSan) => ({
    type: "UPDATE_GAME",
    payload: {
        gameFen,
        moveSan
    },
});

export const placeBomb = (square) => ({
    type: "PLACE_BOMB",
    payload: square,
});

// export const detonateBomb = (square) => ({
//     type: "DETONATE_BOMB",
//     payload: square,
// });

export const setGameStage = (placingBombs) => ({
    type: "SET_GAME_STAGE",
    payload: placingBombs,
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

// // Reset game
// export const resetGame = () => ({
//     type: "RESET_GAME",
// });
