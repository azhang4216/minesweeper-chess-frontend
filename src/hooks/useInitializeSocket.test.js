import { renderHook, act } from '@testing-library/react';
import { socket } from '../socket';
import { useUsername } from './';
import useInitializeSocket from './useInitializeSocket';

// Mock the socket module — hook imports { socket } from '../socket'
jest.mock('../socket', () => ({
    socket: {
        on: jest.fn(),
        off: jest.fn(),
    },
}));

// Mock only the hooks entry that useInitializeSocket needs
jest.mock('./', () => ({
    useUsername: jest.fn(),
}));

// Mock only what's needed from react-redux
jest.mock('react-redux', () => ({
    useDispatch: jest.fn(),
}));

// Mock useNavigate from react-router-dom
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
}));

// Mock ../redux actions — return plain action objects matching real type strings
jest.mock('../redux', () => ({
    actions: {
        resetGame:       () => ({ type: 'RESET_GAME' }),
        setGameFen:      (p) => ({ type: 'SET_GAME_FEN', payload: p }),
        setOrientation:  (p) => ({ type: 'SET_ORIENTATION', payload: p }),
        setGameState:    (p) => ({ type: 'SET_GAME_STATE', payload: p }),
        setPlayerInfo:   (p) => ({ type: 'SET_PLAYER_INFO', payload: p }),
        setOpponentInfo: (p) => ({ type: 'SET_OPPONENT_INFO', payload: p }),
        setMoveHistory:  (p) => ({ type: 'SET_MOVE_HISTORY', payload: p }),
        setTimers:       (p) => ({ type: 'SET_TIMERS', payload: p }),
    },
}));

jest.mock('../constants', () => ({
    GAME_STATES: {
        playing: 'PLAYING',
        inactive: 'INACTIVE',
        placing_bombs: 'PLACING_BOMBS',
        game_over: 'GAME_OVER',
    },
}));

// ── test data ────────────────────────────────────────────────────────────────

const PLAYER_WHITE = { user_id: 'alice', username: 'alice', elo: 1200, is_white: true,  bombs: ['e4'] };
const PLAYER_BLACK = { user_id: 'bob',   username: 'bob',   elo: 1150, is_white: false, bombs: [] };

const BASE_DATA = {
    gameFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    players: [PLAYER_WHITE, PLAYER_BLACK],
    gameState: 'PLAYING',
    whiteTimeLeft: 580,
    blackTimeLeft: 600,
    moveHistory: ['e4'],
};

// ── helpers ──────────────────────────────────────────────────────────────────

let mockDispatch;
let mockNavigate;

// Returns the handler registered for `event` via socket.on
const getCapturedHandler = (event) => {
    const call = socket.on.mock.calls.find(([e]) => e === event);
    return call ? call[1] : undefined;
};

// ── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    mockNavigate = jest.fn();

    const { useDispatch } = require('react-redux');
    const { useNavigate } = require('react-router-dom');
    useDispatch.mockReturnValue(mockDispatch);
    useNavigate.mockReturnValue(mockNavigate);
    useUsername.mockReturnValue('alice');
});

// ── tests ────────────────────────────────────────────────────────────────────

describe('useInitializeSocket', () => {
    test('registers rejoined listener on mount and removes it on unmount', () => {
        const { unmount } = renderHook(() => useInitializeSocket());

        expect(socket.on).toHaveBeenCalledWith('rejoined', expect.any(Function));
        unmount();
        expect(socket.off).toHaveBeenCalledWith('rejoined', expect.any(Function));
    });

    test('dispatches all game-restore actions and navigates to /play-game', () => {
        renderHook(() => useInitializeSocket());
        act(() => { getCapturedHandler('rejoined')(BASE_DATA); });

        const types = mockDispatch.mock.calls.map(([a]) => a.type);
        expect(types).toContain('RESET_GAME');
        expect(types).toContain('SET_GAME_FEN');
        expect(types).toContain('SET_ORIENTATION');
        expect(types).toContain('SET_GAME_STATE');
        expect(types).toContain('SET_PLAYER_INFO');
        expect(types).toContain('SET_OPPONENT_INFO');
        expect(types).toContain('SET_MOVE_HISTORY');
        expect(types).toContain('SET_TIMERS');
        expect(mockNavigate).toHaveBeenCalledWith('/play-game');
    });

    test('does nothing when rejoined has no gameFen (placing_bombs or inactive state)', () => {
        renderHook(() => useInitializeSocket());
        act(() => { getCapturedHandler('rejoined')({ roomId: 'room-abc' }); });

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('does nothing when current user is not in the players list', () => {
        useUsername.mockReturnValue('charlie');
        renderHook(() => useInitializeSocket());
        act(() => { getCapturedHandler('rejoined')(BASE_DATA); });

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('skips SET_MOVE_HISTORY when moveHistory field is absent', () => {
        renderHook(() => useInitializeSocket());
        const { moveHistory: _omit, ...dataNoHistory } = BASE_DATA;
        act(() => { getCapturedHandler('rejoined')(dataNoHistory); });

        const types = mockDispatch.mock.calls.map(([a]) => a.type);
        expect(types).not.toContain('SET_MOVE_HISTORY');
        expect(mockNavigate).toHaveBeenCalledWith('/play-game');
    });

    test('assigns white timer to alice (white) and black timer to bob (black)', () => {
        renderHook(() => useInitializeSocket());
        act(() => { getCapturedHandler('rejoined')(BASE_DATA); });

        const playerInfo   = mockDispatch.mock.calls.find(([a]) => a.type === 'SET_PLAYER_INFO')?.[0].payload;
        const opponentInfo = mockDispatch.mock.calls.find(([a]) => a.type === 'SET_OPPONENT_INFO')?.[0].payload;
        expect(playerInfo.secondsLeft).toBe(580);   // alice is white → whiteTimeLeft
        expect(opponentInfo.secondsLeft).toBe(600); // bob is black  → blackTimeLeft
    });
});
