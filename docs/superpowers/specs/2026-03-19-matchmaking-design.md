# Matchmaking Queue — Frontend Design

## Goal

Replace the create-room/join-room flow with a single "Play Game" experience: select a time control on the home page, click Play, and the backend finds an opponent automatically.

## Architecture

All matchmaking UI lives on the existing home page — no new routes. The searching state is shown in a modal popup. The `roomJoined` socket event (unchanged) triggers navigation to `/play-game`.

## Components

### Home page (`src/components/home-page/index.jsx`)

**Not-logged-in state:** unchanged — "Sign In" and "Play as Guest" buttons.

**Logged-in/authenticated state (including guests after "Play as Guest"):**
- 4 time control pill buttons: 1m, 3m, 5m, 10m — one pre-selected by default (3m)
- A "Play Game" button below them
- Clicking "Play Game" emits `enterQueue` with `{ timeControl }` and opens the searching popup
- If `enterQueue` callback returns `{ success: false }`, show an inline error instead

### Searching popup

A modal overlay shown while in the matchmaking queue. Contains:
- A spinner
- "Searching for opponent..." text
- A "Cancel" button

Cancel emits `leaveQueue` and closes the popup optimistically (before the callback). If `roomJoined` fires before or at the same time as the cancel (race condition), the user navigates to the game — the backend will have already removed the queue entry as part of setting up the match. When `roomJoined` fires during normal searching, the popup closes and the user navigates to `/play-game`.

## Socket events

| Direction | Event | Payload |
|-----------|-------|---------|
| emit | `enterQueue` | `{ timeControl: number }` — timeControl is seconds (60, 180, 300, or 600) |
| emit | `leaveQueue` | (none) |
| listen | `roomJoined` | existing game data — navigate to `/play-game` |

Note: the backend emits `roomJoined` (not `matchFound`) via `io.to(roomId)` after joining both players to the socket room with `io.in(playerId).socketsJoin(roomId)`. There is no separate `matchFound` event.

## Removed

- `src/components/create-room-page/` — deleted
- `src/components/join-room-page/` — deleted
- `/create-room` and `/join-room` routes removed from `App.js`
- `CreateRoomPage` and `JoinRoomPage` removed from `src/components/index.js`
- Nav sidebar links to those routes removed (if any exist)

## Data flow

1. User selects time control (local state on home page)
2. User clicks "Play Game"
3. Home page emits `enterQueue { timeControl }` via socket
4. On `{ success: true }` callback: show searching popup
5. On `roomJoined` event: dispatch `setGameState(placing_bombs)`, navigate to `/play-game` with state
6. On cancel: emit `leaveQueue`, close popup

## Error handling

- If `enterQueue` returns `{ success: false }`: display error message inline (e.g. "Already in a game")
- If the socket disconnects while searching, the backend removes the player from the queue automatically. On reconnect, the searching popup does not reopen — the user is returned to the home page and must click "Play Game" again to re-enter the queue.

## What is not in scope

- Any changes to the `/play-game` board page
- Elo display or match history on the home page
- Queue position or estimated wait time display
