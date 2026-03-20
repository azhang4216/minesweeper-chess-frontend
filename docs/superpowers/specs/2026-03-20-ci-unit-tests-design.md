# CI + Unit Tests Design

**Date:** 2026-03-20

## Goal

Add a GitHub Actions workflow that blocks PRs to `main` unless all unit tests pass. Write the missing unit tests to cover logic and protected routes.

---

## GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

**Triggers:** `pull_request` targeting `main`

**Steps:**
1. Checkout code
2. Set up Node.js (v20) with `cache: 'npm'` to restore node_modules across runs
3. `npm ci` (clean install, respects lockfile)
4. `npm test -- --watchAll=false --ci` (non-interactive, fails fast)

---

## Test Files

### Pure Utility Tests

**`src/utils/fenUtils.test.js`**
Covers `getFenAtIndex`:
- n=0 returns startFen unchanged
- n > moves.length replays all moves
- n=1 returns FEN after first move
- Invalid SANs are skipped silently (partial replay still works)
- moves=[] returns startFen

**`src/utils/popupLogic.test.js`**
Covers:
- `getGameOverAsset("You win")` → returns a truthy value (the happy cat asset)
- `getGameOverAsset("You lose")` → returns a truthy value (the sad hamster asset)
- `getGameOverAsset("Draw")` → returns a truthy value (the handshake meme, any other value)
- `getEloChangeColor(positive)` → "green"
- `getEloChangeColor(negative)` → "red"
- `getEloChangeColor(0)` → "gray"

Note: `popupLogic.js` imports from `../assets` which includes binary files (GIFs, SVGs). CRA's default Jest config stubs these as filename strings, so assertions should check for a truthy/non-null return, not a specific image object. Three distinct return values are expected (win, lose, other) -- tests can assert that win and lose return different values from each other and from draw.

### Redux Tests

**`src/redux/actions.test.js`**
Verifies every action creator returns the correct action object. Covers all 17 creators.

Special cases:
- `logOut` and `resetGame` return no `payload` field -- test only `{ type: "LOG_OUT" }` / `{ type: "RESET_GAME" }` with no payload property assertion.
- `setTimers` injects `syncedAt: Date.now()` dynamically -- test the payload with `expect.any(Number)` for that field rather than a fixed value.
- All other creators return `{ type, payload }` matching their input argument.

**`src/redux/reducer.test.js`**
Verifies all 17 named action type cases plus the default. Key behaviors:
- Initial state shape: assert `state.game` fields (gameFen, isWhite, gameState, moveHistory, player, opponent, placingBombsSeconds) and `state.isAuthLoading=true`. Note: `loggedIn`, `username`, and `playingAsGuest` are NOT present in initialState -- they only appear in state after LOG_IN, LOG_OUT, or PLAY_AS_GUEST fire. Do not assert them on initial state.
- `UPDATE_GAME`: updates FEN and appends to moveHistory; with `temporaryUpdate=true`, does not append
- `PLACE_BOMB`: routes bomb to player.bombs vs opponent.bombs based on square rank and `isWhite`. Test all four combinations:
  - isWhite=true, square rank 3 or 4 → player.bombs
  - isWhite=true, square rank 5 or 6 → opponent.bombs
  - isWhite=false, square rank 5 or 6 → player.bombs
  - isWhite=false, square rank 3 or 4 → opponent.bombs
- `DETONATE_BOMB`: removes the square from the correct player's bomb list (same four-combination ownership logic, verify bomb is removed from the right list)
- `SET_GAME_FEN`, `SET_GAME_STATE`, `SET_PLAYER_INFO`, `SET_OPPONENT_INFO`, `SET_ORIENTATION`, `SET_PLACING_BOMBS_SECONDS`: simple field updates
- `SET_RANDOMIZED_BOMBS`: assigns white/black bombs to player/opponent correctly for both orientations
- `SET_TIMERS`: assigns time correctly for both orientations
- `LOG_IN`: sets username, loggedIn=true, playingAsGuest=false, player name
- `LOG_OUT`: clears username, loggedIn=false, resets player to initial
- `PLAY_AS_GUEST`: sets username, loggedIn=true, playingAsGuest=true
- `SET_MOVE_HISTORY`: replaces moveHistory
- `RESET_GAME`: resets game to initial but preserves current gameState
- `SET_IS_AUTH_LOADING`: sets isAuthLoading flag
- Unknown action type: returns state unchanged (default case)

### Component Tests (Protected Routes)

**`src/components/protected-route/ProtectedGameRoute.test.jsx`**
Uses `@testing-library/react`, `Provider` with a mock Redux store, and `MemoryRouter`.

Mock Redux store shape: `{ loggedIn: bool, isAuthLoading: false }` (both at top level, not under state.game). `isAuthLoading` must be explicitly set to `false` so the component does not short-circuit and return null.

Test cases:
- isAuthLoading=false, loggedIn=false: redirects to `/`
- isAuthLoading=false, loggedIn=true: renders children

**`src/components/protected-route/ProtectedLoginRoute.test.jsx`**
Mock Redux store shape: `{ loggedIn: bool, isAuthLoading: bool }` (both at top level, not under state.game).

Test cases:
- isAuthLoading=true: renders `<div>Loading...</div>` -- query by text "Loading..." (with ellipsis)
- isAuthLoading=false, loggedIn=false: redirects to `/sign-in`
- isAuthLoading=false, loggedIn=true: renders children

---

## Constraints

- No new dependencies -- all testing tools are already in `package.json`
- Mock Redux store via `{ configureStore }` from `@reduxjs/toolkit` or a plain object passed to `<Provider>`
- `fenUtils` tests use `chess.js` (already a dependency) to validate FEN strings
- Protected route tests do not test socket or API logic
