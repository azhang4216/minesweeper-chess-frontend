import appReducer from './reducer';
import { GAME_STATES } from '../constants';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Helper: get initial state
const init = () => appReducer(undefined, { type: '@@INIT' });

// Helper: dispatch an action onto initial state
const dispatch = (action) => appReducer(init(), action);

describe('appReducer', () => {
    describe('initial state', () => {
        test('has correct game fields', () => {
            const state = init();
            expect(state.isAuthLoading).toBe(true);
            expect(state.game.gameFen).toBe(START_FEN);
            expect(state.game.isWhite).toBe(true);
            expect(state.game.gameState).toBe(GAME_STATES.inactive);
            expect(state.game.moveHistory).toEqual([]);
            expect(state.game.player.bombs).toEqual([]);
            expect(state.game.opponent.bombs).toEqual([]);
        });

        test('loggedIn, username, and playingAsGuest are absent from initial state', () => {
            const state = init();
            expect(state.loggedIn).toBeUndefined();
            expect(state.username).toBeUndefined();
            expect(state.playingAsGuest).toBeUndefined();
        });
    });

    describe('default case', () => {
        test('returns the same state reference for unknown action types', () => {
            const state = init();
            expect(appReducer(state, { type: 'UNKNOWN_ACTION' })).toBe(state);
        });
    });

    describe('UPDATE_GAME', () => {
        test('updates gameFen and appends moveSan to moveHistory', () => {
            const state = dispatch({
                type: 'UPDATE_GAME',
                payload: { gameFen: 'new-fen', moveSan: 'e4', temporaryUpdate: false },
            });
            expect(state.game.gameFen).toBe('new-fen');
            expect(state.game.moveHistory).toEqual(['e4']);
        });

        test('does not mutate the original state', () => {
            const original = init();
            const originalHistory = original.game.moveHistory;
            appReducer(original, {
                type: 'UPDATE_GAME',
                payload: { gameFen: 'new-fen', moveSan: 'e4', temporaryUpdate: false },
            });
            expect(original.game.moveHistory).toBe(originalHistory);
        });
    });

    describe('PLACE_BOMB', () => {
        test('isWhite=true, rank 3 → adds to player.bombs', () => {
            const state = dispatch({ type: 'PLACE_BOMB', payload: 'e3' });
            expect(state.game.player.bombs).toContain('e3');
            expect(state.game.opponent.bombs).not.toContain('e3');
        });

        test('isWhite=true, rank 4 → adds to player.bombs', () => {
            const state = dispatch({ type: 'PLACE_BOMB', payload: 'e4' });
            expect(state.game.player.bombs).toContain('e4');
            expect(state.game.opponent.bombs).not.toContain('e4');
        });

        test('isWhite=true, rank 5 → adds to opponent.bombs', () => {
            const state = dispatch({ type: 'PLACE_BOMB', payload: 'e5' });
            expect(state.game.opponent.bombs).toContain('e5');
            expect(state.game.player.bombs).not.toContain('e5');
        });

        test('isWhite=false, rank 5 → adds to player.bombs', () => {
            const asBlack = appReducer(init(), { type: 'SET_ORIENTATION', payload: false });
            const state = appReducer(asBlack, { type: 'PLACE_BOMB', payload: 'e5' });
            expect(state.game.player.bombs).toContain('e5');
            expect(state.game.opponent.bombs).not.toContain('e5');
        });

        test('isWhite=false, rank 6 → adds to player.bombs', () => {
            const asBlack = appReducer(init(), { type: 'SET_ORIENTATION', payload: false });
            const state = appReducer(asBlack, { type: 'PLACE_BOMB', payload: 'e6' });
            expect(state.game.player.bombs).toContain('e6');
            expect(state.game.opponent.bombs).not.toContain('e6');
        });

        test('isWhite=false, rank 3 → adds to opponent.bombs', () => {
            const asBlack = appReducer(init(), { type: 'SET_ORIENTATION', payload: false });
            const state = appReducer(asBlack, { type: 'PLACE_BOMB', payload: 'e3' });
            expect(state.game.opponent.bombs).toContain('e3');
            expect(state.game.player.bombs).not.toContain('e3');
        });

        test('isWhite=false, rank 4 → adds to opponent.bombs', () => {
            const asBlack = appReducer(init(), { type: 'SET_ORIENTATION', payload: false });
            const state = appReducer(asBlack, { type: 'PLACE_BOMB', payload: 'e4' });
            expect(state.game.opponent.bombs).toContain('e4');
            expect(state.game.player.bombs).not.toContain('e4');
        });
    });

    describe('DETONATE_BOMB', () => {
        test('isWhite=true, rank 3 → removes from player.bombs', () => {
            const withBomb = dispatch({ type: 'PLACE_BOMB', payload: 'e3' });
            const state = appReducer(withBomb, { type: 'DETONATE_BOMB', payload: 'e3' });
            expect(state.game.player.bombs).not.toContain('e3');
        });

        test('isWhite=true, rank 5 → removes from opponent.bombs', () => {
            const withBomb = dispatch({ type: 'PLACE_BOMB', payload: 'e5' });
            const state = appReducer(withBomb, { type: 'DETONATE_BOMB', payload: 'e5' });
            expect(state.game.opponent.bombs).not.toContain('e5');
        });

        test('isWhite=false, rank 5 → removes from player.bombs', () => {
            const asBlack = appReducer(init(), { type: 'SET_ORIENTATION', payload: false });
            const withBomb = appReducer(asBlack, { type: 'PLACE_BOMB', payload: 'e5' });
            const state = appReducer(withBomb, { type: 'DETONATE_BOMB', payload: 'e5' });
            expect(state.game.player.bombs).not.toContain('e5');
        });

        test('isWhite=false, rank 6 → removes from player.bombs', () => {
            const asBlack = appReducer(init(), { type: 'SET_ORIENTATION', payload: false });
            const withBomb = appReducer(asBlack, { type: 'PLACE_BOMB', payload: 'e6' });
            const state = appReducer(withBomb, { type: 'DETONATE_BOMB', payload: 'e6' });
            expect(state.game.player.bombs).not.toContain('e6');
        });

        test('isWhite=false, rank 3 → removes from opponent.bombs', () => {
            const asBlack = appReducer(init(), { type: 'SET_ORIENTATION', payload: false });
            const withBomb = appReducer(asBlack, { type: 'PLACE_BOMB', payload: 'e3' });
            const state = appReducer(withBomb, { type: 'DETONATE_BOMB', payload: 'e3' });
            expect(state.game.opponent.bombs).not.toContain('e3');
        });
    });

    describe('simple field updates', () => {
        test('SET_GAME_FEN', () => {
            expect(dispatch({ type: 'SET_GAME_FEN', payload: 'new-fen' }).game.gameFen).toBe('new-fen');
        });

        test('SET_GAME_STATE', () => {
            expect(dispatch({ type: 'SET_GAME_STATE', payload: GAME_STATES.playing }).game.gameState).toBe(GAME_STATES.playing);
        });

        test('SET_PLAYER_INFO replaces player object', () => {
            const player = { name: 'Alice', rating: 1200, bombs: ['e3'], secondsLeft: 300, lastSyncAt: 0 };
            expect(dispatch({ type: 'SET_PLAYER_INFO', payload: player }).game.player).toEqual(player);
        });

        test('SET_OPPONENT_INFO replaces opponent object', () => {
            const opponent = { name: 'Bob', rating: 1100, bombs: [], secondsLeft: 280, lastSyncAt: 0 };
            expect(dispatch({ type: 'SET_OPPONENT_INFO', payload: opponent }).game.opponent).toEqual(opponent);
        });

        test('SET_ORIENTATION', () => {
            expect(dispatch({ type: 'SET_ORIENTATION', payload: false }).game.isWhite).toBe(false);
        });

        test('SET_PLACING_BOMBS_SECONDS', () => {
            expect(dispatch({ type: 'SET_PLACING_BOMBS_SECONDS', payload: { secs: 30, syncedAt: Date.now() } }).game.placingBombsSeconds).toBe(30);
        });

        test('SET_MOVE_HISTORY replaces moveHistory', () => {
            expect(dispatch({ type: 'SET_MOVE_HISTORY', payload: ['e4', 'e5'] }).game.moveHistory).toEqual(['e4', 'e5']);
        });

        test('SET_IS_AUTH_LOADING', () => {
            expect(dispatch({ type: 'SET_IS_AUTH_LOADING', payload: false }).isAuthLoading).toBe(false);
        });
    });

    describe('SET_RANDOMIZED_BOMBS', () => {
        const bombs = { whitePlayerBombs: ['e3', 'e4'], blackPlayerBombs: ['e5', 'e6'] };

        test('isWhite=true: player gets white bombs, opponent gets black bombs', () => {
            const state = dispatch({ type: 'SET_RANDOMIZED_BOMBS', payload: bombs });
            expect(state.game.player.bombs).toEqual(['e3', 'e4']);
            expect(state.game.opponent.bombs).toEqual(['e5', 'e6']);
        });

        test('isWhite=false: player gets black bombs, opponent gets white bombs', () => {
            const asBlack = appReducer(init(), { type: 'SET_ORIENTATION', payload: false });
            const state = appReducer(asBlack, { type: 'SET_RANDOMIZED_BOMBS', payload: bombs });
            expect(state.game.player.bombs).toEqual(['e5', 'e6']);
            expect(state.game.opponent.bombs).toEqual(['e3', 'e4']);
        });
    });

    describe('SET_TIMERS', () => {
        const timers = { whiteTimeLeft: 300, blackTimeLeft: 290, syncedAt: 12345 };

        test('isWhite=true: player gets white time, opponent gets black time', () => {
            const state = dispatch({ type: 'SET_TIMERS', payload: timers });
            expect(state.game.player.secondsLeft).toBe(300);
            expect(state.game.opponent.secondsLeft).toBe(290);
        });

        test('isWhite=false: player gets black time, opponent gets white time', () => {
            const asBlack = appReducer(init(), { type: 'SET_ORIENTATION', payload: false });
            const state = appReducer(asBlack, { type: 'SET_TIMERS', payload: timers });
            expect(state.game.player.secondsLeft).toBe(290);
            expect(state.game.opponent.secondsLeft).toBe(300);
        });
    });

    describe('auth actions', () => {
        test('LOG_IN sets username, loggedIn=true, playingAsGuest=false, player name', () => {
            const state = dispatch({ type: 'LOG_IN', payload: 'alice' });
            expect(state.username).toBe('alice');
            expect(state.loggedIn).toBe(true);
            expect(state.playingAsGuest).toBe(false);
            expect(state.game.player.name).toBe('alice');
        });

        test('LOG_OUT clears username, sets loggedIn=false and playingAsGuest=false, resets player', () => {
            const loggedIn = appReducer(init(), { type: 'LOG_IN', payload: 'alice' });
            const state = appReducer(loggedIn, { type: 'LOG_OUT' });
            expect(state.username).toBe('');
            expect(state.loggedIn).toBe(false);
            expect(state.playingAsGuest).toBe(false);
            const initialPlayer = init().game.player;
            expect(state.game.player.name).toBe(initialPlayer.name);
            expect(state.game.player.bombs).toEqual([]);
            expect(state.game.player.rating).toBe(initialPlayer.rating);
            expect(state.game.player.secondsLeft).toBe(initialPlayer.secondsLeft);
        });

        test('PLAY_AS_GUEST sets loggedIn=true, playingAsGuest=true, player name', () => {
            const state = dispatch({ type: 'PLAY_AS_GUEST', payload: 'guest-xyz' });
            expect(state.username).toBe('guest-xyz');
            expect(state.loggedIn).toBe(true);
            expect(state.playingAsGuest).toBe(true);
            expect(state.game.player.name).toBe('guest-xyz');
        });
    });

    describe('RESET_GAME', () => {
        test('resets game fields to initial values', () => {
            const withMoves = dispatch({
                type: 'UPDATE_GAME',
                payload: { gameFen: 'new-fen', moveSan: 'e4', temporaryUpdate: false },
            });
            const state = appReducer(withMoves, { type: 'RESET_GAME' });
            expect(state.game.gameFen).toBe(START_FEN);
            expect(state.game.moveHistory).toEqual([]);
            expect(state.game.player.bombs).toEqual([]);
        });

        test('preserves current gameState after reset', () => {
            const playing = appReducer(init(), { type: 'SET_GAME_STATE', payload: GAME_STATES.playing });
            const state = appReducer(playing, { type: 'RESET_GAME' });
            expect(state.game.gameState).toBe(GAME_STATES.playing);
        });

        test('preserves auth state (username, loggedIn) after reset', () => {
            const loggedIn = appReducer(init(), { type: 'LOG_IN', payload: 'alice' });
            const state = appReducer(loggedIn, { type: 'RESET_GAME' });
            expect(state.username).toBe('alice');
            expect(state.loggedIn).toBe(true);
            expect(state.playingAsGuest).toBe(false);
        });
    });
});
