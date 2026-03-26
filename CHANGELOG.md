# Changelog

All notable changes to this project will be documented in this file.

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

