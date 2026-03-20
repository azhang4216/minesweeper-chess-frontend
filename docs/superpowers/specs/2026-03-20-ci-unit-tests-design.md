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
2. Set up Node.js (v20)
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
- `getGameOverAsset("You win")` → happyCatGif
- `getGameOverAsset("You lose")` → sadHamsterGif
- `getGameOverAsset("Draw")` → officeHandshakeMeme (any other value)
- `getEloChangeColor(positive)` → "green"
- `getEloChangeColor(negative)` → "red"
- `getEloChangeColor(0)` → "gray"

### Redux Tests

**`src/redux/actions.test.js`**
Verifies every action creator returns `{ type, payload }` with the correct shape. Covers all 14 creators: `updateGameFromServer`, `placeBomb`, `detonateBomb`, `setGameFen`, `setGameState`, `setPlayerInfo`, `setOpponentInfo`, `setOrientation`, `setPlacingBombSeconds`, `setRandomizedBombs`, `setTimers`, `logIn`, `logOut`, `playAsGuest`, `setMoveHistory`, `resetGame`, `setIsAuthLoading`.

**`src/redux/reducer.test.js`**
Verifies all 15 action type cases. Key behaviors:
- Initial state shape is correct
- `UPDATE_GAME`: updates FEN and appends to moveHistory; with `temporaryUpdate=true`, does not append
- `PLACE_BOMB`: routes to player.bombs vs opponent.bombs based on square rank and isWhite
- `DETONATE_BOMB`: removes the square from the correct player's bomb list
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
- Logged-out state: renders `<Navigate to="/" replace />` (user ends up at `/`)
- Logged-in state: renders children

**`src/components/protected-route/ProtectedLoginRoute.test.jsx`**
- isAuthLoading=true: renders loading indicator
- isAuthLoading=false, not logged in: redirects to `/sign-in`
- isAuthLoading=false, logged in: renders children

---

## Constraints

- No new dependencies -- all testing tools are already in `package.json`
- Mock Redux store via `{ configureStore }` from `@reduxjs/toolkit` or a plain object passed to `<Provider>`
- `fenUtils` tests use `chess.js` (already a dependency) to validate FEN strings
- Protected route tests do not test socket or API logic
