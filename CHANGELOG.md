# Changelog

All notable changes to this project will be documented in this file.

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

