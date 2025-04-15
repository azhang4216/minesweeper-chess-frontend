import Chess from 'chess.js';

const initialState = {
    game: new Chess(),
    orientation: "white",
    player: {
        name: "My Name Here",
        rating: 1500,
        bombs: 3
    },
    opponent: {
        name: "Opponent's Name Here",
        rating: 1200,
        bombs: 3
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
        case "MAKE_MOVE": {
            return {}
        }
        case "PLACE_BOMB": {
            const newBombs = [...state.game.plantedBombs, action.payload.square];
            const newBombCount = state.game.player.bombs - 1;
        
            // Prevent planting if no bombs left or already on that square
            if (newBombCount < 0 || state.game.plantedBombs.includes(action.payload.square)) {
                console.log(`bomb already planted on ${action.payload.square}`)
                return state;
            }
        
            return {
                ...state,
                game: {
                    ...state.game,
                    plantedBombs: newBombs,
                    player: {
                        ...state.game.player,
                        bombs: newBombCount
                    }
                }
            };
        }
        default:
            return state
    }
}