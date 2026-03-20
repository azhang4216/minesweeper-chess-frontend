# CI + Unit Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions CI workflow that blocks PRs to `main` unless all unit tests pass, and write the missing unit tests covering utils, Redux, and protected routes.

**Architecture:** Single CI workflow triggers on PRs targeting `main`; six new test files cover pure utility functions, Redux action creators and reducer, and two protected route components using lightweight mock Redux stores.

**Tech Stack:** Jest (via react-scripts/CRA), @testing-library/react, @testing-library/jest-dom, @reduxjs/toolkit (configureStore for mock stores), react-router-dom v7, chess.js

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `.github/workflows/ci.yml` | Runs tests on every PR targeting `main` |
| Create | `src/utils/fenUtils.test.js` | Tests for `getFenAtIndex` |
| Create | `src/utils/popupLogic.test.js` | Tests for `getGameOverAsset`, `getEloChangeColor` |
| Create | `src/redux/actions.test.js` | Tests for all 17 action creators |
| Create | `src/redux/reducer.test.js` | Tests for all 17 reducer cases + default |
| Create | `src/components/protected-route/ProtectedGameRoute.test.jsx` | Tests for ProtectedGameRoute |
| Create | `src/components/protected-route/ProtectedLoginRoute.test.jsx` | Tests for ProtectedLoginRoute |

---

### Task 1: GitHub Actions CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --watchAll=false --ci
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add github actions workflow to run tests on pr to main"
```

---

### Task 2: fenUtils Tests

**Files:**
- Create: `src/utils/fenUtils.test.js`
- Reference: `src/utils/fenUtils.js`

**Context:** `getFenAtIndex(startFen, moves, n)` replays `n` moves from `startFen` using chess.js. Returns `startFen` when `n <= 0` or `moves` is empty. Invalid SANs are silently skipped. The FEN strings below are standard chess positions -- do not change them.

- [ ] **Step 1: Write `src/utils/fenUtils.test.js`**

```js
import { getFenAtIndex } from './fenUtils';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AFTER_E4_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const AFTER_E4_E5_FEN = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';

describe('getFenAtIndex', () => {
    test('n=0 returns startFen unchanged', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], 0)).toBe(START_FEN);
    });

    test('negative n returns startFen', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], -1)).toBe(START_FEN);
    });

    test('empty moves array returns startFen regardless of n', () => {
        expect(getFenAtIndex(START_FEN, [], 5)).toBe(START_FEN);
    });

    test('n=1 returns FEN after first move', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], 1)).toBe(AFTER_E4_FEN);
    });

    test('n=2 returns FEN after second move', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], 2)).toBe(AFTER_E4_E5_FEN);
    });

    test('n greater than moves.length replays all available moves', () => {
        expect(getFenAtIndex(START_FEN, ['e4', 'e5'], 100)).toBe(AFTER_E4_E5_FEN);
    });

    test('invalid SAN moves are skipped silently and valid moves still apply', () => {
        // 'INVALID' is skipped; 'e4' is applied; result is same as replaying only e4
        const result = getFenAtIndex(START_FEN, ['INVALID', 'e4'], 2);
        expect(result).toBe(AFTER_E4_FEN);
    });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --watchAll=false --testPathPattern=fenUtils
```

Expected: 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/utils/fenUtils.test.js
git commit -m "test: add getFenAtIndex unit tests"
```

---

### Task 3: popupLogic Tests

**Files:**
- Create: `src/utils/popupLogic.test.js`
- Reference: `src/utils/popupLogic.js`

**Context:** `popupLogic.js` imports from `../assets`, which contains binary files (GIFs, SVGs). CRA's Jest config automatically stubs binary assets as filename strings -- no manual mocking needed. Because of this stubbing, assertions check for truthy return values and that the three outcomes return *distinct* values, rather than checking exact asset objects.

- [ ] **Step 1: Write `src/utils/popupLogic.test.js`**

```js
import { getGameOverAsset, getEloChangeColor } from './popupLogic';

describe('getGameOverAsset', () => {
    test('returns a truthy value for "You win"', () => {
        expect(getGameOverAsset('You win')).toBeTruthy();
    });

    test('returns a truthy value for "You lose"', () => {
        expect(getGameOverAsset('You lose')).toBeTruthy();
    });

    test('returns a truthy value for any other result', () => {
        expect(getGameOverAsset('Draw')).toBeTruthy();
    });

    test('win, lose, and draw return distinct assets', () => {
        const win = getGameOverAsset('You win');
        const lose = getGameOverAsset('You lose');
        const draw = getGameOverAsset('Draw');
        expect(win).not.toBe(lose);
        expect(win).not.toBe(draw);
        expect(lose).not.toBe(draw);
    });
});

describe('getEloChangeColor', () => {
    test('positive change returns "green"', () => {
        expect(getEloChangeColor(10)).toBe('green');
        expect(getEloChangeColor(1)).toBe('green');
    });

    test('negative change returns "red"', () => {
        expect(getEloChangeColor(-10)).toBe('red');
        expect(getEloChangeColor(-1)).toBe('red');
    });

    test('zero returns "gray"', () => {
        expect(getEloChangeColor(0)).toBe('gray');
    });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --watchAll=false --testPathPattern=popupLogic
```

Expected: 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/utils/popupLogic.test.js
git commit -m "test: add popupLogic unit tests"
```

---

### Task 4: Redux Action Creator Tests

**Files:**
- Create: `src/redux/actions.test.js`
- Reference: `src/redux/actions.js`

**Context:**
- `logOut` and `resetGame` return no `payload` field -- assert only `{ type }`.
- `setTimers` injects `syncedAt: Date.now()` dynamically -- use `expect.any(Number)` for that field.
- All other creators return `{ type, payload }` matching their input.

- [ ] **Step 1: Write `src/redux/actions.test.js`**

```js
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
            payload: { gameFen: 'fen123', moveSan: 'e4', temporaryUpdate: false },
        });
    });

    test('updateGameFromServer passes temporaryUpdate=true', () => {
        expect(updateGameFromServer('fen123', 'e4', true)).toEqual({
            type: 'UPDATE_GAME',
            payload: { gameFen: 'fen123', moveSan: 'e4', temporaryUpdate: true },
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
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --watchAll=false --testPathPattern=actions
```

Expected: 18 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/redux/actions.test.js
git commit -m "test: add action creator unit tests"
```

---

### Task 5: Redux Reducer Tests

**Files:**
- Create: `src/redux/reducer.test.js`
- Reference: `src/redux/reducer.js`, `src/constants.js`

**Context:**
- `appReducer(undefined, { type: '@@INIT' })` returns `initialState` (hits the default case).
- `loggedIn`, `username`, and `playingAsGuest` are **absent** from `initialState` -- they only appear after `LOG_IN`, `LOG_OUT`, or `PLAY_AS_GUEST` fire. Do not assert them on initial state.
- Bomb ownership rule: `square[1]` is the rank digit (e.g., `'e4'[1] === '4'`). Ranks 3-4 are the player's when `isWhite=true`; ranks 5-6 are the player's when `isWhite=false`.
- `RESET_GAME` resets all `game` fields to `initialState.game` *except* it preserves the current `gameState`.

- [ ] **Step 1: Write `src/redux/reducer.test.js`**

```js
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

        test('with temporaryUpdate=true, updates FEN but does not append to moveHistory', () => {
            const state = dispatch({
                type: 'UPDATE_GAME',
                payload: { gameFen: 'new-fen', moveSan: 'e4', temporaryUpdate: true },
            });
            expect(state.game.gameFen).toBe('new-fen');
            expect(state.game.moveHistory).toEqual([]);
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
            // initial state has isWhite=true
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
            expect(dispatch({ type: 'SET_PLACING_BOMBS_SECONDS', payload: 30 }).game.placingBombsSeconds).toBe(30);
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
            // player is reset to initial values
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
    });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --watchAll=false --testPathPattern=reducer
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/redux/reducer.test.js
git commit -m "test: add reducer unit tests"
```

---

### Task 6: ProtectedGameRoute Tests

**Files:**
- Create: `src/components/protected-route/ProtectedGameRoute.test.jsx`
- Reference: `src/components/protected-route/ProtectedGameRoute.jsx`

**Context:**
- `ProtectedGameRoute.jsx` calls both `useIsLoggedIn` and `useIsAuthLoading`. It has three branches:
  1. `isAuthLoading=true` → returns `null` (renders nothing)
  2. `isAuthLoading=false, !isLoggedIn` → `<Navigate to="/" replace />`
  3. `isAuthLoading=false, loggedIn` → renders children
- `isAuthLoading: false` must be explicit in `preloadedState` because the reducer's `initialState` sets `isAuthLoading: true`, which would cause the component to always return `null`.
- `<Navigate>` requires a route tree to work. We use `MemoryRouter` with `Routes`/`Route` so the redirect can land somewhere renderable.

- [ ] **Step 1: Write `src/components/protected-route/ProtectedGameRoute.test.jsx`**

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedGameRoute from './ProtectedGameRoute';
import appReducer from '../../redux/reducer';

const makeStore = (loggedIn) =>
    configureStore({
        reducer: appReducer,
        preloadedState: { loggedIn, isAuthLoading: false },
    });

const renderRoute = (loggedIn) =>
    render(
        <Provider store={makeStore(loggedIn)}>
            <MemoryRouter initialEntries={['/play-game']}>
                <Routes>
                    <Route path="/" element={<div>Home Page</div>} />
                    <Route
                        path="/play-game"
                        element={
                            <ProtectedGameRoute>
                                <div>Game Page</div>
                            </ProtectedGameRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );

describe('ProtectedGameRoute', () => {
    test('renders nothing when isAuthLoading is true', () => {
        render(
            <Provider store={configureStore({ reducer: appReducer, preloadedState: { isAuthLoading: true, loggedIn: false } })}>
                <MemoryRouter initialEntries={['/play-game']}>
                    <Routes>
                        <Route path="/" element={<div>Home Page</div>} />
                        <Route path="/play-game" element={<ProtectedGameRoute><div>Game Page</div></ProtectedGameRoute>} />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );
        expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
        expect(screen.queryByText('Game Page')).not.toBeInTheDocument();
    });

    test('redirects to / when not logged in', () => {
        renderRoute(false);
        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.queryByText('Game Page')).not.toBeInTheDocument();
    });

    test('renders children when logged in', () => {
        renderRoute(true);
        expect(screen.getByText('Game Page')).toBeInTheDocument();
        expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --watchAll=false --testPathPattern=ProtectedGameRoute
```

Expected: Both tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/protected-route/ProtectedGameRoute.test.jsx
git commit -m "test: add ProtectedGameRoute unit tests"
```

---

### Task 7: ProtectedLoginRoute Tests

**Files:**
- Create: `src/components/protected-route/ProtectedLoginRoute.test.jsx`
- Reference: `src/components/protected-route/ProtectedLoginRoute.jsx`

**Context:**
- The component reads `state.isAuthLoading` and `state.loggedIn`. Both are at the top level of Redux state (not under `state.game`).
- When `isAuthLoading=true`, it renders `<div>Loading...</div>` (with ellipsis -- exact string matters for the query).
- When `isAuthLoading=false` and `loggedIn=false`, it renders `<Navigate to="/sign-in" replace />`.
- When `isAuthLoading=false` and `loggedIn=true`, it renders children.

- [ ] **Step 1: Write `src/components/protected-route/ProtectedLoginRoute.test.jsx`**

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedLoginRoute from './ProtectedLoginRoute';
import appReducer from '../../redux/reducer';

const makeStore = (overrides) =>
    configureStore({
        reducer: appReducer,
        preloadedState: overrides,
    });

const renderRoute = (storeOverrides) =>
    render(
        <Provider store={makeStore(storeOverrides)}>
            <MemoryRouter initialEntries={['/dashboard']}>
                <Routes>
                    <Route path="/sign-in" element={<div>Sign In Page</div>} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedLoginRoute>
                                <div>Dashboard Page</div>
                            </ProtectedLoginRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );

describe('ProtectedLoginRoute', () => {
    test('renders "Loading..." when isAuthLoading is true', () => {
        renderRoute({ isAuthLoading: true, loggedIn: false });
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });

    test('redirects to /sign-in when not loading and not logged in', () => {
        renderRoute({ isAuthLoading: false, loggedIn: false });
        expect(screen.getByText('Sign In Page')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });

    test('renders children when not loading and logged in', () => {
        renderRoute({ isAuthLoading: false, loggedIn: true });
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
        expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --watchAll=false --testPathPattern=ProtectedLoginRoute
```

Expected: All 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/protected-route/ProtectedLoginRoute.test.jsx
git commit -m "test: add ProtectedLoginRoute unit tests"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run the full test suite**

```bash
npm test -- --watchAll=false --ci
```

Expected: All tests across all 6 files pass with no failures or errors.

- [ ] **Step 2: Commit any fixes if needed (otherwise skip)**
