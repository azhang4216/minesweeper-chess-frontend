const initialState = {
    gameFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // starting position
    isWhite: true,
    isMyTurn: false,
    placingBombs: false, 
    moveHistory: [],
    player: {
        name: "My Name Here",
        rating: 0,
        bombs: []
    },
    opponent: {
        name: "Opponent's Name Here",
        rating: 0,
        bombs: []
    }
}

/*
Rules of Reducers (https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers#rules-of-reducers)
- should only calculate new state value based on state and action
- not allowed to modify the existing state. must make immutable updates by making changes to COPIED state
- must not do async logic
*/
export default function appReducer(state = initialState, action) {
    switch (action.type) {
        case "UPDATE_GAME": {
            const updatedFen = action.payload;
            return {
                ...state,
                gameFen: updatedFen,
            };
        }

        case "PLACE_BOMB":
            // based on the location of the square, we can determine whether it's our or our opponent's bomb
            const square = action.payload;
            return ((state.isWhite && (square[1] === '3' || square[1] === '4')) || (!state.isWhite && (square[1] === '5' || square[1] === '6'))) ? {
                ...state,
                player: {
                    ...state.player,
                    bombs: [...state.player.bombs, action.payload]
                }
            } : {
                ...state,
                opponent: {
                    ...state.opponent,
                    bombs: [...state.opponent.bombs, action.payload]
                }
            };

        // case "DETONATE_BOMB":
        //     return {
        //         ...state,
        //         placedBombs: state.placedBombs.filter(sq => sq !== action.payload),
            // };

        case "SET_GAME_STAGE":
            return {
                ...state,
                placingBombs: action.payload,
            }

        case "SET_PLAYER_INFO":
            return {
                ...state,
                player: action.payload,
            };

        case "SET_OPPONENT_INFO":
            return {
                ...state,
                opponent: action.payload,
            };

        case "SET_ORIENTATION":
            return {
                ...state,
                isWhite: action.payload,
            };

        // case "RESET_GAME":
        //     return initialState;

        default:
            return state;
    }
}