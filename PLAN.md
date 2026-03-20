# Frontend Fix Plan

Branch: `az/claude-rework`

This document covers every change needed in the frontend. Sections 1–3 are independent bug fixes. Sections 4–5 depend on the corresponding backend changes being deployed first.

---

## Section 1: Fix timer drift (client-side correction)

**Problem:** The server only sends `syncTime` after each move. Between moves the frontend runs a `setInterval(1000ms)` independently. `setInterval` drifts by 1–3 seconds over a long game. When a move is made and the server sends the corrected time, the displayed timer jumps visibly.

**Fix:** Store the server timestamp alongside each time value in Redux. The `Timer` component computes its starting value as `serverSeconds - floor((Date.now() - lastSyncAt) / 1000)`, so it already accounts for any delay between when the server computed the time and when the client received it.

### 1a. `src/redux/reducer.js` — extend `SET_TIMERS`

```js
// BEFORE
case "SET_TIMERS": {
    const { whiteTimeLeft, blackTimeLeft } = action.payload;
    return {
        ...state,
        game: {
            ...state.game,
            player: {
                ...state.game.player,
                secondsLeft: state.game.isWhite ? whiteTimeLeft : blackTimeLeft,
            },
            opponent: {
                ...state.game.opponent,
                secondsLeft: state.game.isWhite ? blackTimeLeft : whiteTimeLeft,
            }
        }
    };
}

// AFTER
case "SET_TIMERS": {
    const { whiteTimeLeft, blackTimeLeft, syncedAt } = action.payload;
    return {
        ...state,
        game: {
            ...state.game,
            player: {
                ...state.game.player,
                secondsLeft: state.game.isWhite ? whiteTimeLeft : blackTimeLeft,
                lastSyncAt: syncedAt,
            },
            opponent: {
                ...state.game.opponent,
                secondsLeft: state.game.isWhite ? blackTimeLeft : whiteTimeLeft,
                lastSyncAt: syncedAt,
            }
        }
    };
}
```

Also update the initial state defaults so `lastSyncAt` always exists:

```js
player: {
    name: "My Name",
    rating: 0,
    bombs: [],
    secondsLeft: 100,
    lastSyncAt: Date.now(),
},
opponent: {
    name: "Opponent's Name",
    rating: 0,
    bombs: [],
    secondsLeft: 100,
    lastSyncAt: Date.now(),
}
```

### 1b. `src/redux/actions.js` — pass `syncedAt` through `setTimers`

```js
// BEFORE
export const setTimers = ({ whiteTimeLeft, blackTimeLeft }) => ({
    type: "SET_TIMERS",
    payload: { whiteTimeLeft, blackTimeLeft },
});

// AFTER
export const setTimers = ({ whiteTimeLeft, blackTimeLeft }) => ({
    type: "SET_TIMERS",
    payload: { whiteTimeLeft, blackTimeLeft, syncedAt: Date.now() },
});
```

`Date.now()` is called in the action creator (at dispatch time) not in the reducer, which keeps the reducer pure.

### 1c. `src/components/timer/index.jsx` — compute corrected start value

The `Timer` component currently reinitializes from `initialSeconds` on every `syncTime` event (because `initialSeconds` is in the `useEffect` dependency array). With the correction, we want to initialize from `serverSeconds - elapsed`, not bare `serverSeconds`.

The component needs two props instead of one: `serverSeconds` (the value from Redux) and `lastSyncAt` (the timestamp from Redux). It computes the corrected start value once when these change.

```jsx
// BEFORE
const Timer = ({ isActive, initialSeconds }) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    // ...
    useEffect(() => {
        setSecondsLeft(initialSeconds);
        // ...
    }, [initialSeconds, isActive]);
    // ...
};

// AFTER
const Timer = ({ isActive, serverSeconds, lastSyncAt }) => {
    const correctedSeconds = Math.max(
        0,
        serverSeconds - Math.floor((Date.now() - lastSyncAt) / 1000)
    );
    const [secondsLeft, setSecondsLeft] = useState(correctedSeconds);
    // ...
    useEffect(() => {
        const corrected = Math.max(
            0,
            serverSeconds - Math.floor((Date.now() - lastSyncAt) / 1000)
        );
        setSecondsLeft(corrected);
        // ... rest of interval setup unchanged
    }, [serverSeconds, lastSyncAt, isActive]);
    // ...
};
```

### 1d. Update all `Timer` call sites

There are three places `Timer` is rendered. Update each to pass `serverSeconds` and `lastSyncAt` instead of `initialSeconds`.

**`src/components/board-page/index.jsx`** — opponent timer (line ~278):
```jsx
// BEFORE
<Timer
    isActive={!isMyMove && (gameState === GAME_STATES.playing) && moveHistory.length > 0}
    initialSeconds={opponent.secondsLeft}
/>

// AFTER
<Timer
    isActive={!isMyMove && (gameState === GAME_STATES.playing) && moveHistory.length > 0}
    serverSeconds={opponent.secondsLeft}
    lastSyncAt={opponent.lastSyncAt}
/>
```

**`src/components/board-page/index.jsx`** — player timer (line ~307):
```jsx
// BEFORE
<Timer
    isActive={isMyMove && (gameState === GAME_STATES.playing) && moveHistory.length > 0}
    initialSeconds={player.secondsLeft}
/>

// AFTER
<Timer
    isActive={isMyMove && (gameState === GAME_STATES.playing) && moveHistory.length > 0}
    serverSeconds={player.secondsLeft}
    lastSyncAt={player.lastSyncAt}
/>
```

**`src/components/side-panel/index.jsx`** — bomb placement timer (line ~36):

This timer uses a different data path (`bombPlantingTimeLeft` from Redux, not from `syncTime`) and doesn't need drift correction. It can keep using `initialSeconds`. No change needed here.

---

## Section 2: Fix player rating display bug

**File:** `src/components/board-page/index.jsx`

**Problem (line ~88):** `setPlayerInfo` is called with `rating: opponentInfo.elo` instead of `rating: myInfo.elo`. Your own ELO is always shown as your opponent's ELO in the board header.

```js
// BEFORE
dispatch(actions.setPlayerInfo({
    name: myInfo.username,
    rating: opponentInfo.elo,   // ← bug
    bombs: [],
    secondsLeft: secsToPlay,
}));

// AFTER
dispatch(actions.setPlayerInfo({
    name: myInfo.username,
    rating: myInfo.elo,         // ← fix
    bombs: [],
    secondsLeft: secsToPlay,
}));
```

---

## Section 3: Dead code cleanup

Remove all commented-out code blocks. No behavior change.

| File | What to remove |
|---|---|
| `src/components/board-page/index.jsx` | Lines 45–70 (commented-out initialization block before the useEffect); lines 172–226 (cursor customization code); the commented `handleNavigateHome` function; the commented-out `gameState === placing_bombs` wrapper class div (line 263 — both branches are identical anyway) |
| `src/socket/boardSocketHandlers.jsx` | Lines 35–62 (commented-out `handleRoomJoined` handler) |
| `src/components/join-room-page/index.jsx` | Lines 104–109 (commented-out back button) |
| `src/hooks/useGameState.js` | Lines 47–79 (commented-out `usePrompt` and `useGameStatus` hooks) |

---

## Section 4: Implement disconnect countdown UI

**Depends on:** Backend `disconnect.js` rewrite (Section 3 of backend plan)

**File:** `src/socket/boardSocketHandlers.jsx`

**Problem:** `handleDisconnect` currently logs and sets a room message, but doesn't give the remaining player any visible feedback about how long they have to wait for their opponent to reconnect. The `// TODO: start a timeout timer for opponent` comment marks this gap.

The backend already sends `timeoutMs` (30000) in the `playerDisconnected` event.

**Fix:** Set a piece of local state in `board-page` that shows a countdown. The simplest approach is to pass a setter down to `handleDisconnect` (the same way `setDisplayWinLossPopup` is passed).

### Changes needed:

**`src/socket/boardSocketHandlers.jsx`**

Add `setDisconnectCountdown` to the destructured props:

```js
export const useBoardSocketHandlers = ({
    setRoomMessage,
    setGameOverReason,
    setGameOverResult,
    setmyEloChange,
    setOpponentEloChange,
    setDisplayWinLossPopup,
    setDisconnectCountdown,   // new
}) => {
```

Update `handleDisconnect` to start the countdown:

```js
const handleDisconnect = ({ disconnectedPlayerId, timeoutMs, message }) => {
    console.log(`${disconnectedPlayerId} disconnected. ${timeoutMs}ms to reconnect.`);
    setRoomMessage(message);
    setDisconnectCountdown(Math.floor(timeoutMs / 1000)); // start countdown in seconds
};
```

Also handle `playerRejoined` (already emitted by backend when player comes back):

```js
const handlePlayerRejoined = ({ playerId }) => {
    console.log(`${playerId} reconnected.`);
    setDisconnectCountdown(null); // clear the countdown
    setRoomMessage("");
};
```

Add it to the return object and to the `return { ... }` at the bottom.

**`src/components/board-page/index.jsx`**

Add state:
```js
const [disconnectCountdown, setDisconnectCountdown] = useState(null);
```

Pass it into `useBoardSocketHandlers`:
```js
const { ... } = useBoardSocketHandlers({
    ...
    setDisconnectCountdown,
});
```

Register the `playerRejoined` handler:
```js
socket.on('playerRejoined', handlePlayerRejoined);
// and in cleanup:
socket.off('playerRejoined', handlePlayerRejoined);
```

Tick the countdown down each second using a `useEffect`:
```js
useEffect(() => {
    if (disconnectCountdown === null || disconnectCountdown <= 0) return;
    const id = setTimeout(() => setDisconnectCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(id);
}, [disconnectCountdown]);
```

Show it in the JSX above the board:
```jsx
{disconnectCountdown !== null && disconnectCountdown > 0 && (
    <div className="disconnect-notice">
        Opponent disconnected — {disconnectCountdown}s to reconnect
    </div>
)}
```

---

## Section 5: Restore game state on reconnect

**Depends on:** Backend `rejoinRoom.js` rewrite (Section 5 of backend plan)

**Files:** `src/hooks/useInitializeSocket.js`, `src/components/board-page/index.jsx`

**Problem:** When a player refreshes their browser mid-game, `useInitializeSocket` emits `rejoin` and receives a `rejoined` event. The handler currently only logs the roomId. After the backend rewrite, `rejoined` now includes full game state (FEN, move history, player info, timers). The frontend needs to restore that state to Redux.

### `src/hooks/useInitializeSocket.js`

The hook currently doesn't have access to `dispatch` or the username. It needs both to restore game state. Add them as parameters:

```js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../socket";
import { actions } from "../redux";
import { GAME_STATES } from "../constants";
import { useUsername } from "./";

const useInitializeSocket = () => {
    const dispatch = useDispatch();
    const myUsername = useUsername();

    useEffect(() => {
        const playerId = localStorage.getItem("playerId");
        if (!playerId) return;

        socket.auth = { playerId };
        socket.connect();

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("rejoin", playerId);
        });

        socket.on("rejoined", (data) => {
            console.log("Rejoined room:", data.roomId);

            // if the server sent back full game state, restore it
            if (data.gameFen && data.players) {
                const me = data.players.find(p => p.user_id === myUsername);
                const opponent = data.players.find(p => p.user_id !== myUsername);
                if (!me || !opponent) return;

                dispatch(actions.resetGame());
                dispatch(actions.setGameFen(data.gameFen));
                dispatch(actions.setOrientation(me.is_white));
                dispatch(actions.setGameState(data.gameState ?? GAME_STATES.playing));

                dispatch(actions.setPlayerInfo({
                    name: me.username,
                    rating: me.elo,
                    bombs: me.bombs ?? [],
                    secondsLeft: me.is_white ? data.whiteTimeLeft : data.blackTimeLeft,
                }));

                dispatch(actions.setOpponentInfo({
                    name: opponent.username,
                    rating: opponent.elo,
                    bombs: opponent.bombs ?? [],
                    secondsLeft: opponent.is_white ? data.whiteTimeLeft : data.blackTimeLeft,
                }));

                // restore move history from server-provided PGN moves
                if (Array.isArray(data.moveHistory)) {
                    data.moveHistory.forEach(san => {
                        dispatch(actions.updateGameFromServer(null, san));
                    });
                }

                dispatch(actions.setTimers({
                    whiteTimeLeft: data.whiteTimeLeft,
                    blackTimeLeft: data.blackTimeLeft,
                }));
            }
        });

        return () => {
            socket.off("connect");
            socket.off("rejoined");
            socket.disconnect();
        };
    // myUsername is stable (set at login, doesn't change mid-session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

export default useInitializeSocket;
```

**Note on `updateGameFromServer` for history replay:** The action currently adds to `moveHistory` in Redux when `temporaryUpdate` is false. Dispatching it with `gameFen: null` means the FEN won't update, but the history will accumulate. This is the simplest path to restore `moveHistory` without changing the action signature. An alternative is to add a `SET_MOVE_HISTORY` action that sets the full array at once — that is cleaner and avoids N dispatches. Use whichever fits better.

---

## Order of implementation

1. Section 2: Player rating fix — 1 line, no dependencies ✅ Done
2. Section 3: Dead code cleanup — no dependencies ✅ Done
3. Section 1: Timer drift fix — independent of backend changes ✅ Done
4. Section 4: Disconnect countdown — after backend `disconnect.js` rewrite is deployed ✅ Done
5. Section 5: Reconnect state restore — after backend `rejoinRoom.js` rewrite is deployed ✅ Done

---

## Additional fixes (2026-03-19)

### Bug: `SET_MOVE_HISTORY` action added

`useInitializeSocket.js` was dispatching `updateGameFromServer(null, san)` for each move in history replay. The `UPDATE_GAME` reducer overwrites `gameFen` with the passed value — so passing `null` would zero out the FEN after replay. Fixed by adding a dedicated `SET_MOVE_HISTORY` action that sets `moveHistory` directly without touching `gameFen`.

### Bug: SidePanel bomb timer API mismatch

`SidePanel` was still passing `initialSeconds` to `Timer`, but the Timer component was updated in Section 1 to use `serverSeconds`/`lastSyncAt`. Fixed by adding a local `bombSyncAt` state (updated whenever `bombPlantingTimeLeft` changes) and passing `serverSeconds={bombPlantingTimeLeft}` + `lastSyncAt={bombSyncAt}`.

### UI improvements

- **Timer urgency states**: `warning` (amber, ≤30s), `low` (red + slow pulse, ≤10s), `critical` (bright red + fast pulse, ≤5s)
- **Active player indicator**: Player info bar gets a purple left-border glow when it's that player's turn
- **Win/Loss popup**: Added a semi-transparent backdrop overlay with fade-in; popup itself animates in with scale+slide
- **Move history auto-scroll**: Side panel scrolls to the latest move on each update
- **Disconnect notice**: Slides in with animation
- **Board page layout**: Removed the `title-logo` from the board page to give the game full vertical space; board page is now properly vertically centered

---

## What is NOT in scope for this branch

- Cursor customization during bomb placement (already commented out, leaving removed)
- `usePrompt` navigation guard (already commented out)
- Pagination for room listing (noted TODO in `join-room-page`)
- Any visual redesign or new components
