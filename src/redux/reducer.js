import { GAME_STATES } from '../constants';

const initialState = {
    isAuthLoading: true, // we assume we are loading on reauth

    game: {
        // default setup so we have something to load in while pending
        gameFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // starting position
        isWhite: true,
        gameState: GAME_STATES.inactive,
        placingBombsSeconds: 100, // amount of time alloted to planting bombs - shouldn't change more than once (at set)
        moveHistory: [],
        // loggedIn: false,          // playing as a guest also counts as logging in!
        // playingAsGuest: false,
        player: {
            name: "My Name",
            rating: 0,
            bombs: [],
            secondsLeft: 100
        },
        opponent: {
            name: "Opponent's Name",
            rating: 0,
            bombs: [],
            secondsLeft: 100
        }
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
            const { gameFen, moveSan, temporaryUpdate } = action.payload;
            console.log(`Updating game: ${gameFen}, ${moveSan}, ${temporaryUpdate}`);
            return {
                ...state,
                game: {
                    ...state.game,
                    gameFen,
                    ...(temporaryUpdate ? {} : { moveHistory: [...state.game.moveHistory, moveSan] })
                }
            };
        }

        case "PLACE_BOMB": {
            const square = action.payload;
            const isMyBomb = (state.game.isWhite && (square[1] === '3' || square[1] === '4')) || (!state.game.isWhite && (square[1] === '5' || square[1] === '6'));
            return {
                ...state,
                game: {
                    ...state.game,
                    player: isMyBomb
                        ? {
                            ...state.game.player,
                            bombs: [...state.game.player.bombs, action.payload]
                        }
                        : state.game.player,
                    opponent: !isMyBomb
                        ? {
                            ...state.game.opponent,
                            bombs: [...state.game.opponent.bombs, action.payload]
                        }
                        : state.game.opponent
                }
            };
        }

        case "DETONATE_BOMB": {
            const squareToExplode = action.payload;
            const isMyBomb = (state.game.isWhite && (squareToExplode[1] === '3' || squareToExplode[1] === '4')) || (!state.game.isWhite && (squareToExplode[1] === '5' || squareToExplode[1] === '6'));
            console.log(`Denotating bomb on ${squareToExplode}, and it is ${isMyBomb ? "" : "not "}my bomb.`)
            return {
                ...state,
                game: {
                    ...state.game,
                    player: isMyBomb
                        ? {
                            ...state.game.player,
                            bombs: state.game.player.bombs.filter(sq => sq !== squareToExplode),
                        }
                        : state.game.player,
                    opponent: !isMyBomb
                        ? {
                            ...state.game.opponent,
                            bombs: state.game.opponent.bombs.filter(sq => sq !== squareToExplode),
                        }
                        : state.game.opponent
                }
            };
        }

        case "SET_GAME_FEN":
            return {
                ...state,
                game: {
                    ...state.game,
                    gameFen: action.payload,
                }
            }

        case "SET_GAME_STATE":
            return {
                ...state,
                game: {
                    ...state.game,
                    gameState: action.payload,
                }
            }

        case "SET_PLAYER_INFO":
            return {
                ...state,
                game: {
                    ...state.game,
                    player: action.payload,
                }
            };

        case "SET_OPPONENT_INFO":
            return {
                ...state,
                game: {
                    ...state.game,
                    opponent: action.payload,
                }
            };

        case "SET_ORIENTATION":
            console.log(`In reducer, setting orientation to white: ${action.payload}`);
            return {
                ...state,
                game: {
                    ...state.game,
                    isWhite: action.payload,
                }
            };

        case "SET_PLACING_BOMBS_SECONDS":
            return {
                ...state,
                game: {
                    ...state.game,
                    placingBombsSeconds: action.payload,
                }
            };

        case "SET_RANDOMIZED_BOMBS": {
            const { whitePlayerBombs, blackPlayerBombs } = action.payload;
            return {
                ...state,
                game: {
                    ...state.game,
                    player: {
                        ...state.game.player,
                        bombs: state.game.isWhite ? whitePlayerBombs : blackPlayerBombs,
                    },
                    opponent: {
                        ...state.game.opponent,
                        bombs: state.game.isWhite ? blackPlayerBombs : whitePlayerBombs,
                    }
                }
            };
        }

        case "SET_TIMERS": {
            const { whiteTimeLeft, blackTimeLeft } = action.payload;
            console.log(`Setting timers in Redux for white, black: ${whiteTimeLeft}, ${blackTimeLeft}`);
            return {
                ...state,
                game: {
                    ...state.game,
                    player: {
                        ...state.game.player,
                        secondsLeft: state.game.isWhite ? whiteTimeLeft : blackTimeLeft,
                    },
                    opponent: {
                        ...state.game.opponent,
                        secondsLeft: state.game.isWhite ? blackTimeLeft : whiteTimeLeft,
                    }
                }
            };
        }

        case "LOG_IN":
            console.log(`reducer state: logging in as ${action.payload}`);
            return {
                ...state,
                username: action.payload,
                loggedIn: true,
                playingAsGuest: false,
                game: {
                    ...state.game,
                    player: {
                        ...state.game.player,
                        name: action.payload,
                    },
                }
            }

        case "LOG_OUT":
            console.log("reducer state: logging out");
            return {
                ...state,
                username: "",
                loggedIn: false,
                playingAsGuest: false,
                game: {
                    ...state.game,
                    player: initialState.game.player,
                }
            }

        case "PLAY_AS_GUEST":
            console.log(`reducer state: playing as guest ${action.payload}`);
            return {
                ...state,
                username: action.payload,
                loggedIn: true,
                playingAsGuest: true,
                game: {
                    ...state.game,
                    player: {
                        ...state.game.player,
                        name: action.payload, // unique uuid assigned by server
                    },
                }
            }

        case "RESET":
            return initialState;

        case "SET_IS_AUTH_LOADING":
            return {
                ...state,
                isAuthLoading: action.payload,
            }

        default:
            return state;
    }
}