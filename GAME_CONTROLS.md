# Game Controls — Backend Socket Event Spec

> Written: 2026-03-19
> Frontend branch: `az/claude-rework`

This document specifies the new socket events the frontend will emit and listen for as part of the game controls feature (resign, offer draw, rematch). These need to be implemented in the backend.

---

## 1. Resign

### Client emits: `resign`

No payload. Emitted when the resigning player confirms the action.

### Server handles:

1. Identify the resigning player via `socket.data.playerId`.
2. Identify the game room and the other player (the winner).
3. Emit `winLossGameOver` to the room (same payload as timeout or disconnect forfeit):
   ```json
   {
     "winner": "w",
     "by": "resignation",
     "whiteEloChange": <number>,
     "blackEloChange": <number>
   }
   ```
4. Call `finishAndRecordGame` with result `"WHITE_WINS"` or `"BLACK_WINS"`.
5. Stop all timers.

### Notes:
- Only valid when `game_state === PLAYING`. Ignore the event otherwise.
- `by: "resignation"` is a new value the frontend already displays in the WinLossPopup as `You win/lose by resignation`.

---

## 2. Offer Draw

### Client emits: `offerDraw`

No payload.

### Server handles:

1. Identify the offering player and their room.
2. Relay a `drawOffer` event to the **other** player only (not back to the offerer):
   ```json
   { "fromPlayerId": "<playerId>" }
   ```
3. Only valid when `game_state === PLAYING`. Ignore otherwise.
4. Optionally: prevent spam by tracking cooldown (one offer per 30s per player).

### Client emits: `drawResponse`

```json
{ "accepted": true | false }
```

Emitted by the player who received `drawOffer` after they accept or decline.

### Server handles `drawResponse`:

- **If `accepted: true`**: emit `drawGameOver` to the room:
  ```json
  {
    "by": "agreement",
    "whiteEloChange": <number>,
    "blackEloChange": <number>
  }
  ```
  Call `finishAndRecordGame` with result `"DRAW"`. Stop all timers.

- **If `accepted: false`**: emit `drawOfferDeclined` to the **original offerer** only:
  ```json
  {}
  ```
  (The frontend shows a "Your draw offer was declined." notification.)

---

## 3. Rematch

### Client emits: `requestRematch`

No payload.

### Server handles:

1. Track which players in a game have requested a rematch (use a per-room counter or set on the room object).
2. When **both** players have emitted `requestRematch`:
   a. Create a new game room (same players, colors swapped — white ↔ black).
   b. Set `game_state = PLACING_BOMBS`.
   c. Emit `rematchReady` to **both** players with the same payload shape as an initial room join:
      ```json
      {
        "roomId": "<newRoomId>",
        "players": [
          { "user_id": "...", "username": "...", "elo": 1200, "is_white": true },
          { "user_id": "...", "username": "...", "elo": 1100, "is_white": false }
        ],
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "secsToPlaceBomb": 60,
        "secsToPlay": 300
      }
      ```
   d. Clean up the old room.
3. When **only one** player has requested: emit `rematchOffered` to the **other** player:
   ```json
   {}
   ```
   This triggers the frontend to change the "Rematch" button to "Accept Rematch".

### Frontend flow:
- Player A clicks Rematch → emits `requestRematch` → button shows "Waiting..."
- Backend emits `rematchOffered` to Player B
- Player B sees button change to "Accept Rematch" → clicks → emits `requestRematch`
- Backend sees both players requested → emits `rematchReady` to both
- Frontend receives `rematchReady` → navigates to board page with new game data (full re-mount, same as initial join)

### Notes:
- If a player navigates away (disconnects) before the other accepts, treat it as a declined rematch.
- `secsToPlaceBomb` and `secsToPlay` should use the same values as the previous game (or server-configured defaults).
- Colors should be swapped from the previous game to ensure fairness.

---

## 4. Handler registration

Add to `registerHandlers.js`:

```js
socket.on('resign', resign(socket, io, rooms, activePlayers));
socket.on('offerDraw', offerDraw(socket, io, rooms));
socket.on('drawResponse', drawResponse(socket, io, rooms));
socket.on('requestRematch', requestRematch(socket, io, rooms, activePlayers));
```

Create new handler files:
- `handlers/gameHandlers/resign.js`
- `handlers/gameHandlers/offerDraw.js`
- `handlers/gameHandlers/drawResponse.js`
- `handlers/gameHandlers/requestRematch.js`

---

## 5. Summary of new events

| Direction | Event | Payload | When |
|---|---|---|---|
| Client → Server | `resign` | none | Active game, player wants to resign |
| Client → Server | `offerDraw` | none | Active game, offering a draw |
| Client → Server | `drawResponse` | `{ accepted: bool }` | After receiving `drawOffer` |
| Client → Server | `requestRematch` | none | After game over |
| Server → Client | `drawOffer` | `{ fromPlayerId }` | Relayed to opponent of offerer |
| Server → Client | `drawOfferDeclined` | none | Sent to offerer when opponent declines |
| Server → Client | `rematchOffered` | none | Sent to opponent when first player requests |
| Server → Client | `rematchReady` | `{ roomId, players, fen, secsToPlaceBomb, secsToPlay }` | Sent to both when both request |

Events reused unchanged from existing implementation:
- `winLossGameOver` — used for resign (with `by: "resignation"`)
- `drawGameOver` — used for accepted draw (with `by: "agreement"`)
