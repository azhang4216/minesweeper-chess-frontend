import {
    updateGameFromServer,
    placeBomb,
    detonateBomb,
    setGameFen,
    setGameState,
    setPlayerInfo,
    setOpponentInfo,
    setOrientation,
    setPlacingBombSeconds,
    setRandomizedBombs,
    setTimers,
    logIn,
    logOut,
    playAsGuest,
    setMoveHistory,
    resetGame,
    setIsAuthLoading,
} from './actions';

describe('action creators', () => {
    test('updateGameFromServer defaults temporaryUpdate to false', () => {
        expect(updateGameFromServer('fen123', 'e4')).toEqual({
            type: 'UPDATE_GAME',
            payload: { gameFen: 'fen123', moveSan: 'e4', temporaryUpdate: false, fenOnly: false },
        });
    });

    test('updateGameFromServer passes temporaryUpdate=true', () => {
        expect(updateGameFromServer('fen123', 'e4', true)).toEqual({
            type: 'UPDATE_GAME',
            payload: { gameFen: 'fen123', moveSan: 'e4', temporaryUpdate: true, fenOnly: false },
        });
    });

    test('placeBomb', () => {
        expect(placeBomb('e4')).toEqual({ type: 'PLACE_BOMB', payload: 'e4' });
    });

    test('detonateBomb', () => {
        expect(detonateBomb('e4')).toEqual({ type: 'DETONATE_BOMB', payload: 'e4' });
    });

    test('setGameFen', () => {
        expect(setGameFen('some-fen')).toEqual({ type: 'SET_GAME_FEN', payload: 'some-fen' });
    });

    test('setGameState', () => {
        expect(setGameState('PLAYING')).toEqual({ type: 'SET_GAME_STATE', payload: 'PLAYING' });
    });

    test('setPlayerInfo', () => {
        const player = { name: 'Alice', rating: 1200, bombs: [], secondsLeft: 300 };
        expect(setPlayerInfo(player)).toEqual({ type: 'SET_PLAYER_INFO', payload: player });
    });

    test('setOpponentInfo', () => {
        const opponent = { name: 'Bob', rating: 1100, bombs: [], secondsLeft: 300 };
        expect(setOpponentInfo(opponent)).toEqual({ type: 'SET_OPPONENT_INFO', payload: opponent });
    });

    test('setOrientation', () => {
        expect(setOrientation(true)).toEqual({ type: 'SET_ORIENTATION', payload: true });
        expect(setOrientation(false)).toEqual({ type: 'SET_ORIENTATION', payload: false });
    });

    test('setPlacingBombSeconds', () => {
        expect(setPlacingBombSeconds(60)).toEqual({ type: 'SET_PLACING_BOMBS_SECONDS', payload: 60 });
    });

    test('setRandomizedBombs', () => {
        const bombs = { whitePlayerBombs: ['e3'], blackPlayerBombs: ['e6'] };
        expect(setRandomizedBombs(bombs)).toEqual({ type: 'SET_RANDOMIZED_BOMBS', payload: bombs });
    });

    test('setTimers includes a numeric syncedAt timestamp', () => {
        expect(setTimers({ whiteTimeLeft: 300, blackTimeLeft: 290 })).toEqual({
            type: 'SET_TIMERS',
            payload: { whiteTimeLeft: 300, blackTimeLeft: 290, syncedAt: expect.any(Number) },
        });
    });

    test('logIn', () => {
        expect(logIn('alice')).toEqual({ type: 'LOG_IN', payload: 'alice' });
    });

    test('logOut has no payload', () => {
        expect(logOut()).toEqual({ type: 'LOG_OUT' });
    });

    test('playAsGuest', () => {
        expect(playAsGuest('guest-123')).toEqual({ type: 'PLAY_AS_GUEST', payload: 'guest-123' });
    });

    test('setMoveHistory', () => {
        expect(setMoveHistory(['e4', 'e5'])).toEqual({ type: 'SET_MOVE_HISTORY', payload: ['e4', 'e5'] });
    });

    test('resetGame has no payload', () => {
        expect(resetGame()).toEqual({ type: 'RESET_GAME' });
    });

    test('setIsAuthLoading', () => {
        expect(setIsAuthLoading(true)).toEqual({ type: 'SET_IS_AUTH_LOADING', payload: true });
        expect(setIsAuthLoading(false)).toEqual({ type: 'SET_IS_AUTH_LOADING', payload: false });
    });
});
