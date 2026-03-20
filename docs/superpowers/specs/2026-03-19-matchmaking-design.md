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

Cancel emits `leaveQueue` and closes the popup. When `roomJoined` fires, the popup closes and the user navigates to `/play-game` (same navigation as the old join-room flow).

## Socket events

| Direction | Event | Payload |
|-----------|-------|---------|
| emit | `enterQueue` | `{ timeControl: number }` |
| emit | `leaveQueue` | (none) |
| listen | `roomJoined` | existing game data — navigate to `/play-game` |

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
- If socket disconnects while searching: popup closes naturally on reconnect/page state reset

## What is not in scope

- Any changes to the `/play-game` board page
- Elo display or match history on the home page
- Queue position or estimated wait time display
