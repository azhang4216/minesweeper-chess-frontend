# Changelog

All notable changes to this project will be documented in this file.

## [0.3.1] - 2026-03-26

### Fixed
- **Race condition**: `locationRef` and `myUsernameRef` now updated synchronously in render body instead of via `useEffect`, eliminating stale-value window in socket handlers
- **Guest rejoin**: `is_guest` flag now propagated through rejoin path (`serializePlayers` → `handleRejoined` → Redux), fixing broken "Add Friend" / opponent-link detection after reconnect
- **Elo display for guests**: `myEloChange` null-guarded with `?? 0` in WinLossPopup, preventing NaN display when guests finish a game
- **Detonation timing**: `handleDrawGameOver` now uses `lastExplosionWasKingRef` delay (5500ms / 3200ms) matching `handleWinLossGameOver`, fixing race where draw popup appeared mid-explosion animation
- **Pawn promotion validation**: client-side legality check now always passes `promotion: 'q'` to chess.js, fixing moves being incorrectly rejected when a pawn reaches the back rank
- **String coupling**: `handleRematchDeclined` now calls dedicated `onRematchDeclined()` callback instead of routing through string-matched `setRoomMessage`
- **Guest session leak**: `logOut()` now clears `guestPlayerId` from localStorage on every logout path

### Tests
- Regression tests: `logOut` localStorage clearing, `UPDATE_GAME` with null `moveSan`, `is_guest` propagation through rejoin path

## [0.3.0] - 2026-03-26

### Added
- **UX polish overhaul**: cinematic detonation overlay with 5 expanding rings, impact flash, emoji bounce, and per-piece flavor text; board shake animation on explosion
- **Meme GIF backgrounds** on win/loss/draw popup (happy cat, sad hamster, cat sadge) with subtle opacity and border-radius treatment
- **Home page personality**: random tagline pool of 26 lines including chess personality references (Eric Rosen, Hikaru Nakamura, Levy Rozman), ELO badge for logged-in players, cycling search copy with elapsed timer, CSS mine spinner in matchmaking state
- **Profile page redesign**: hero layout with large Rajdhani username and 42px ELO block, card-based friend/game sections, inline action toast (replaces `alert()`), clickable player names in past games and friends list
- **Search page redesign**: sleek icon-left input, accent focus ring, left-border hover on result rows
- **Win/loss popup**: "Add Friend" button for post-game friend requests, opponent profile link, mutual rematch lockout
- **Guest UUID persistence**: guest player ID now saved to localStorage so guests rejoin active games after page reload

### Fixed
- Profile past games: result labels now match backend values (`WHITE_WINS`/`BLACK_WINS`/`DRAW`); guest players detected via UUID regex fallback when `is_guest` flag missing on legacy records
- Detonation overlays: queued so rapid double-explosions both animate sequentially instead of the second canceling the first
- Bomb timer: now uses Redux `bombTimerSyncedAt` for correct reset on rematch
- Board state: `Chessboard` keyed on `roomId` so state fully clears on new game or rematch
- Move validation: chess.js validates on drop, distinguishing illegal-move from invalid-FEN
- Redux `gameFen`: dispatched immediately on explosion instead of waiting for move-sequence race condition
- Rematch: global socket listeners ensure offline opponents receive offer and ready events; decline now emits `declineRematch` and surfaces "Rematch declined" to requester
- Home page bomb images: switched from fragile `nth-child` selectors to `.bomb--1/2/3` explicit classes, fixing oversized bomb appearing when tagline was added

### Tests
- Updated `actions.test.js`: removed stale `temporaryUpdate`/`fenOnly` expectations from `updateGameFromServer`; updated `setPlacingBombSeconds` to expect `{ secs, syncedAt }` payload
- Updated `reducer.test.js`: removed stale `temporaryUpdate=true` test; fixed `SET_PLACING_BOMBS_SECONDS` dispatch to use `{ secs, syncedAt }` format
- Updated `useInitializeSocket.test.js`: added `useLocation` to react-router-dom mock

## [0.2.1] - 2026-03-26

### Fixed
- History navigation animation: clicking move i now snaps to position i-1 instantly then animates the single step to i, rather than animating the full distance from the current view position
- Premove stale closure: `onPieceDrop` callback now reads `isMyTurn`, `isHistory`, and `gameState` from refs synced on every render, preventing premoves from silently no-oping when the closure captured stale state
- Play Game button: disabled condition now correctly blocks `placing_bombs` and `matching` states; mount effect resets `gameState` to `inactive` so returning players from a completed game always see an enabled button
- Guest login: navigating to home page during `placing_bombs` state no longer leaves the Play Game button disabled; `gameState` resets on home mount
- `useInitializeSocket`: passes `roomId` in navigate state so `BoardPage` receives required game data on reconnect; dispatches `setGameState(inactive)` before navigating home on `noActiveGame` so the Play Game button is immediately usable

### Tests
- Updated `useInitializeSocket.test.js`: added `roomId` to `BASE_DATA` and updated navigate assertions to include the state object
- Updated `actions.test.js`: added `fenOnly: false` to `updateGameFromServer` expected payloads

## [0.2.0] - 2026-03-20

### Added
- ELO-based matchmaking queue: replaced create/join room buttons with time-control pills and a matchmaking UI that shows searching state and allows cancellation
- Game controls: resign, offer draw (with accept/decline modal), and rematch (with opponent name in popup) socket handlers and UI
- Move history navigation: clickable move list and prev/next arrow buttons in the SidePanel; board interaction disabled when viewing past positions
- `getFenAtIndex` utility and `fenUtils` to reconstruct board position at any point in move history
- Disconnect countdown: shows live timer in the UI when the opponent disconnects during a game
- `game-view-page` component for spectating completed games
- 30-second draw offer cooldown after a decline
- Profile game history page (`/api/profile/game/:id` already on backend)
- Full game state restoration on socket reconnect: `rejoined` event restores FEN, timers, player info, move history, and navigates back to `/play-game`
- `ProtectedGameRoute` auth-loading gate: prevents premature redirect to home while `validateToken` is still in flight
- Test suite: 80 tests across 7 suites (actions, reducer, fenUtils, popupLogic, ProtectedGameRoute, ProtectedLoginRoute, useInitializeSocket)
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) — runs tests on every PR to `main`

### Fixed
- Refresh during active game now restores board state, timers, and move history automatically
- `useInitializeSocket`: removed stale localStorage dependency (`playerId` was never stored there); rewrote with `useRef` to avoid stale closure in the `rejoined` socket listener
- `useAuthState`: emits `rejoin` event after token validation so reconnect is triggered on every page load
- `ProtectedGameRoute`: no longer redirects to home before auth loading completes
- Timer displayed correctly after server sync (`syncTime` floored to integers)
- Fixed login link hover visibility on white card background
- Corrected rematch navigation route to `/play-game`
- Removed duplicate active state from play nav button

### Changed
- Navigation: replaced play dropdown with a single play nav link
- `confirm-modal` and `win-loss-popup` styling aligned with design system
- Removed `create-room-page` and `join-room-page` components (replaced by matchmaking queue)

