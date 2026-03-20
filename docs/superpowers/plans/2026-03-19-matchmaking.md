# Matchmaking Queue Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the create-room/join-room flow with a single home-page-based matchmaking experience: select a time control, click Play Game, and the backend finds an opponent automatically.

**Architecture:** All matchmaking UI lives on the existing home page — no new routes. A searching popup modal appears while queued. The existing `roomJoined` socket event (unchanged) triggers navigation to `/play-game`. The old `/create-room` and `/join-room` routes and their page components are deleted entirely.

**Tech Stack:** React, Redux, Socket.IO client, React Router v6, CSS custom properties (existing dark theme)

---

## File Map

| File | Change |
|------|--------|
| `src/components/home-page/index.jsx` | Replace logged-in buttons with time control pills + Play Game + searching popup |
| `src/components/home-page/style.css` | Add pill/popup styles; remove unused `.create-room-button`, `.join-room-button` |
| `src/components/navigation-side-bar/index.jsx` | Replace Play dropdown (Create Room + Join Room) with single Play → `/` link |
| `src/App.js` | Remove `CreateRoomPage`/`JoinRoomPage` imports, routes, and `validPaths` entries |
| `src/components/index.js` | Remove `CreateRoomPage` and `JoinRoomPage` exports |
| `src/components/create-room-page/` | **Delete entire directory** |
| `src/components/join-room-page/` | **Delete entire directory** |

---

## Task 1: Update home page — time controls + Play Game + searching popup

**Files:**
- Modify: `src/components/home-page/index.jsx`

### Socket contract (from backend PLAN.md Section 9)

- emit: `enterQueue` with `{ timeControl: number }` — timeControl in seconds (60, 180, 300, 600)
- emit: `leaveQueue` (no payload)
- callback from `enterQueue`: `{ success: true }` or `{ success: false, message: string }`
- listen: `roomJoined` with `{ roomId, players, fen, secsToPlaceBomb, secsToPlay }` — same as current join-room-page handler

- [ ] **Step 1: Replace the home page component**

Replace `src/components/home-page/index.jsx` with:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_STATES } from '../../constants';
import { useGameState, useIsLoggedIn } from "../../hooks";
import { useDispatch } from 'react-redux';
import { actions } from "../../redux";
import { generateGuestUUID } from "../../api";
import { useSocket } from "../../socket";
import './style.css';

const TIME_CONTROLS = [
    { label: '1m',  seconds: 60 },
    { label: '3m',  seconds: 180 },
    { label: '5m',  seconds: 300 },
    { label: '10m', seconds: 600 },
];

const HomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const socket = useSocket();
    const gameState = useGameState();
    const isLoggedIn = useIsLoggedIn();

    const [selectedTimeControl, setSelectedTimeControl] = useState(180);
    const [searching, setSearching] = useState(false);
    const [queueError, setQueueError] = useState('');

    const handleSignIn = () => navigate("/sign-in");

    const handlePlayAsGuest = async () => {
        try {
            const assignedGuestID = await generateGuestUUID();
            dispatch(actions.playAsGuest(assignedGuestID));
            socket.emit("authenticate", { playerId: assignedGuestID });
        } catch (e) {
            console.error("Failed to generate guest UUID:", e);
        }
    };

    const handlePlayGame = () => {
        setQueueError('');
        socket.emit("enterQueue", { timeControl: selectedTimeControl }, (response) => {
            if (response?.success) {
                setSearching(true);
            } else {
                setQueueError(response?.message || "Failed to join queue. Please try again.");
            }
        });
    };

    const handleCancel = () => {
        setSearching(false);
        socket.emit("leaveQueue");
    };

    // Listen for roomJoined — fires when the backend finds a match
    useEffect(() => {
        const handleRoomJoined = (data) => {
            setSearching(false);
            dispatch(actions.setGameState(GAME_STATES.placing_bombs));
            navigate("/play-game", { state: data });
        };

        socket.on("roomJoined", handleRoomJoined);
        return () => socket.off("roomJoined", handleRoomJoined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // If the socket disconnects while searching, close the popup.
    // The backend automatically removes the player from the queue on disconnect,
    // so the user must click Play Game again after reconnecting.
    useEffect(() => {
        const handleDisconnect = () => setSearching(false);
        socket.on("disconnect", handleDisconnect);
        return () => socket.off("disconnect", handleDisconnect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ButtonGroups = () => {
        if (isLoggedIn) {
            return (
                <div className="matchmaking-group">
                    <div className="time-control-pills">
                        {TIME_CONTROLS.map(({ label, seconds }) => (
                            <button
                                key={seconds}
                                className={`time-control-pill${selectedTimeControl === seconds ? ' time-control-pill--active' : ''}`}
                                onClick={() => setSelectedTimeControl(seconds)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {queueError && <p className="queue-error">{queueError}</p>}
                    <button
                        className="play-game-button"
                        onClick={handlePlayGame}
                        disabled={gameState === GAME_STATES.playing}
                    >
                        Play Game
                    </button>
                </div>
            );
        }
        return (
            <div className="button-group">
                <button onClick={handleSignIn} className="sign-in-button">
                    Sign In
                </button>
                <button onClick={handlePlayAsGuest} className="guest-button">
                    Play as Guest
                </button>
            </div>
        );
    };

    return (
        <div className="front-page">
            <img src="/landmine_white.png" alt="Landmine Chess Logo" className="logo" />
            <div className="join-create-room-container">
                {ButtonGroups()}
            </div>

            {searching && (
                <div className="searching-overlay">
                    <div className="searching-popup">
                        <div className="searching-spinner" />
                        <p className="searching-text">Searching for opponent...</p>
                        <button className="searching-cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <img src="/landmine_logo.png" alt="" className="bomb" aria-hidden="true" />
            <img src="/landmine_logo.png" alt="" className="bomb" aria-hidden="true" />
            <img src="/landmine_logo.png" alt="" className="bomb" aria-hidden="true" />
            <img src="/landmine_logo.png" alt="" className="bomb" aria-hidden="true" />
        </div>
    );
};

export default HomePage;
```

- [ ] **Step 2: Verify the file looks correct**

Read `src/components/home-page/index.jsx` and confirm:
- `TIME_CONTROLS` array has 4 entries (60, 180, 300, 600)
- `selectedTimeControl` defaults to 180
- `enterQueue` emits with `{ timeControl: selectedTimeControl }`
- `roomJoined` listener dispatches `setGameState(placing_bombs)` and navigates
- `leaveQueue` emits on cancel
- Searching popup renders when `searching === true`

- [ ] **Step 3: Commit**

```bash
git add src/components/home-page/index.jsx
git commit -m "feat: replace create/join room buttons with time control + matchmaking queue"
```

---

## Task 2: Update home page CSS

**Files:**
- Modify: `src/components/home-page/style.css`

- [ ] **Step 1: Add new styles and remove unused ones**

In `src/components/home-page/style.css`:

1. Remove the `.create-room-button`, `.create-room-button:hover:enabled`, `.join-room-button`, `.join-room-button:hover:enabled`, `.join-room-button:disabled` blocks (lines 62–113).

2. Add after the `.button-group` rule:

```css
/* Matchmaking controls */
.matchmaking-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.time-control-pills {
    display: flex;
    gap: 8px;
}

.time-control-pill {
    padding: 10px 20px;
    font-size: 15px;
    border-radius: 8px;
    border: 1px solid var(--border-strong);
    cursor: pointer;
    font-family: 'Rajdhani', Impact, sans-serif;
    font-weight: 700;
    letter-spacing: 0.06em;
    background: var(--panel);
    color: var(--text-muted);
    transition: transform 0.12s ease, background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
    min-width: 60px;
    text-align: center;
}

.time-control-pill:hover {
    background: var(--panel-hover);
    color: var(--text);
    border-color: var(--accent);
}

.time-control-pill--active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
    box-shadow: 0 2px 12px var(--accent-glow);
}

.time-control-pill--active:hover {
    background: var(--accent-light);
    border-color: var(--accent-light);
}

.play-game-button {
    padding: 14px 48px;
    font-size: 15px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-family: 'Rajdhani', Impact, sans-serif;
    font-weight: 700;
    letter-spacing: 0.08em;
    background: var(--accent);
    color: white;
    box-shadow: 0 4px 20px var(--accent-glow);
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    min-width: 200px;
    text-align: center;
}

.play-game-button:hover:enabled {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px var(--accent-glow);
    background: var(--accent-light);
}

.play-game-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.queue-error {
    color: var(--error, #e55);
    font-size: 13px;
    margin: 0;
}

/* Searching popup */
.searching-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(2px);
}

.searching-popup {
    background: var(--panel);
    border: 1px solid var(--border-strong);
    border-radius: 16px;
    padding: 40px 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
    min-width: 280px;
}

.searching-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.searching-text {
    margin: 0;
    font-family: 'Rajdhani', Impact, sans-serif;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--text);
}

.searching-cancel {
    padding: 10px 28px;
    font-size: 14px;
    border-radius: 8px;
    border: 1px solid var(--border-strong);
    cursor: pointer;
    font-family: 'Rajdhani', Impact, sans-serif;
    font-weight: 700;
    letter-spacing: 0.06em;
    background: var(--panel);
    color: var(--text-muted);
    transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.searching-cancel:hover {
    background: var(--panel-hover);
    color: var(--text);
    border-color: var(--accent);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home-page/style.css
git commit -m "style: add time control pills and searching popup styles"
```

---

## Task 3: Update navigation sidebar

**Files:**
- Modify: `src/components/navigation-side-bar/index.jsx`

The Play dropdown currently has two items: "Create Room" (→ `/create-room`) and "Join Room" (→ `/join-room`). Replace the entire dropdown with a single plain nav-link button that navigates directly to `/`.

- [ ] **Step 1: Remove dropdown state and replace Play section**

In `src/components/navigation-side-bar/index.jsx`:

1. Remove `const [playOpen, setPlayOpen] = useState(false);` (line 15)
2. Remove `const playRef = useRef(null);` (line 17)
3. Remove the `playRef` reference in the outside-click `useEffect` handler:
   - Remove: `if (playRef.current && !playRef.current.contains(e.target)) setPlayOpen(false);`
4. Remove the route-change `useEffect` line: `setPlayOpen(false);`
5. Replace the entire `{/* Play dropdown */}` block (lines 88–118) with:

```jsx
{/* Play — navigates to home where matchmaking lives */}
<button
    className={`nav-link${isActive('/') ? ' nav-link--active' : ''}`}
    onClick={go('/')}
    disabled={!isLoggedIn && !isGuest}
    title={!isLoggedIn && !isGuest ? 'Sign in to play' : undefined}
>
    Play
</button>
```

6. Remove `useRef` from the import at line 1 if it is no longer used anywhere else (check: `userRef` still uses it, so keep `useRef`).

- [ ] **Step 2: Verify no remaining references to `/create-room` or `/join-room` in the sidebar**

Search the file for `create-room` and `join-room` — both should be gone.

- [ ] **Step 3: Commit**

```bash
git add src/components/navigation-side-bar/index.jsx
git commit -m "feat: replace play dropdown with single play nav link"
```

---

## Task 4: Remove routes and component exports

**Files:**
- Modify: `src/App.js`
- Modify: `src/components/index.js`

- [ ] **Step 1: Update App.js**

In `src/App.js`:

1. Remove `CreateRoomPage` and `JoinRoomPage` from the import (lines 7–8).
2. Remove `/^\/create-room$/` and `/^\/join-room$/` from `validPaths` (lines 34–35).
3. Remove the `/create-room` route block (lines 55–59).
4. Remove the `/join-room` route block (lines 60–64).

After edits the imports should start with `BoardPage, HomePage, ProtectedGameRoute, ProtectedLoginRoute, ResetPasswordPage, ...` (no CreateRoomPage or JoinRoomPage).

- [ ] **Step 2: Update src/components/index.js**

Remove lines:
```js
export { default as CreateRoomPage } from './create-room-page';
export { default as JoinRoomPage } from './join-room-page';
```

- [ ] **Step 3: Commit**

```bash
git add src/App.js src/components/index.js
git commit -m "chore: remove create-room and join-room routes and exports"
```

---

## Task 5: Delete old page directories

**Files:**
- Delete: `src/components/create-room-page/` (entire directory)
- Delete: `src/components/join-room-page/` (entire directory)

- [ ] **Step 1: Delete the directories**

```bash
rm -rf src/components/create-room-page
rm -rf src/components/join-room-page
```

- [ ] **Step 2: Verify deletion**

```bash
ls src/components/
```

Confirm neither `create-room-page` nor `join-room-page` appears in the output.

- [ ] **Step 3: Verify the app builds without errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes with no errors referencing `create-room-page` or `join-room-page`. Pre-existing warnings (chess.js source map) are fine.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete create-room-page and join-room-page components"
```

---

## Manual smoke test checklist

After all tasks complete:

1. **Not logged in:** Home page shows Sign In + Play as Guest buttons. Play nav link is disabled.
2. **After Play as Guest:** Home shows time control pills (3m pre-selected) + Play Game button.
3. **Click 1m pill:** Pill highlights, 3m deselects.
4. **Click Play Game:** Searching popup appears with spinner + "Searching for opponent..." + Cancel button.
5. **Click Cancel:** Popup closes, returns to home with time controls visible. No error.
6. **`/create-room` URL:** Shows 404 Not Found page.
7. **`/join-room` URL:** Shows 404 Not Found page.
8. **Play nav link:** Navigates to `/` (home page).
