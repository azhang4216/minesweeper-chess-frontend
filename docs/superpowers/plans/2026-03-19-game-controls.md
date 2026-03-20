# Game Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add move navigation (|< ← → >|), in-game action buttons (Resign, Offer Draw), and post-game buttons (Rematch, New Game) to the board UI.

**Architecture:** `viewIndex` lives as local state in `BoardPage` (not Redux — it's ephemeral UI state). `BoardPage` computes `displayFen` using `chess.js` and passes it down to `ChessBoard` and `SidePanel` via props. Socket events for resign/draw/rematch are emitted from `BoardPage` and handled in `boardSocketHandlers`. The `SidePanel` gets `viewIndex`, `onNavigate`, and action callbacks as props.

**Tech Stack:** `chess.js` (new dep, FEN reconstruction from SAN history), React local state, socket.io events, existing `ConfirmModal` component

---

## File Map

| File | Change |
|---|---|
| `package.json` | Add `chess.js` dependency |
| `src/utils/fenUtils.js` | **New** — `getFenAtIndex(startFen, moves, n)` |
| `src/utils/index.js` | Export `getFenAtIndex` |
| `src/components/board-page/index.jsx` | `viewIndex`, `startingFen`, draw offer state, resign/draw/rematch emits |
| `src/components/chessboard/index.jsx` | Accept `displayFen` prop; disable moves when viewing history |
| `src/components/side-panel/index.jsx` | Nav controls, move clicks, action buttons; receives props |
| `src/components/side-panel/style.css` | Styles for nav bar and action buttons |
| `src/components/confirm-modal/style.css` | Update to dark theme (`--surface`, `--border-strong`) |
| `src/socket/boardSocketHandlers.jsx` | Add `drawOffer`, `drawOfferDeclined`, `rematchOffered` handlers |

---

## Task 1: Install chess.js and create `fenUtils.js`

**Files:**
- Modify: `package.json`
- Create: `src/utils/fenUtils.js`
- Modify: `src/utils/index.js`

- [ ] **Step 1: Install chess.js**

```bash
cd /Users/ange/repos/minesweeper-chess-frontend && npm install chess.js
```

Expected: `chess.js` added to `node_modules` and `package.json`.

- [ ] **Step 2: Create `src/utils/fenUtils.js`**

```js
import { Chess } from 'chess.js';

/**
 * Returns the FEN string after applying `n` moves from `startFen`.
 * n = 0  → returns startFen (position before any move)
 * n = 1  → returns FEN after first move
 * n = k  → returns FEN after moves[0..k-1]
 *
 * If n >= moves.length, replays all available moves.
 * Invalid SANs are skipped silently (can happen with bomb-explosion positions
 * where the FEN diverges; we still want partial replay to work).
 */
export const getFenAtIndex = (startFen, moves, n) => {
    if (n <= 0 || !moves.length) return startFen;
    const chess = new Chess(startFen);
    const count = Math.min(n, moves.length);
    for (let i = 0; i < count; i++) {
        try { chess.move(moves[i]); } catch (_) { /* skip invalid */ }
    }
    return chess.fen();
};
```

- [ ] **Step 3: Export from `src/utils/index.js`**

Add at the top of the file (preserving existing exports):
```js
export { getFenAtIndex } from './fenUtils';
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/utils/fenUtils.js src/utils/index.js
git commit -m "feat: add chess.js and getFenAtIndex utility"
```

---

## Task 2: Move navigation state in `BoardPage`

**Files:**
- Modify: `src/components/board-page/index.jsx`

This task adds `viewIndex` and `startingFen` local state to `BoardPage`, computes `displayFen`, passes it to `ChessBoard`, and auto-jumps on new moves.

**`viewIndex` convention:**
- `viewIndex = 0` → show starting position (before any move)
- `viewIndex = k` → show position after k moves
- `viewIndex = moveHistory.length` → at live position (moves allowed)

- [ ] **Step 1: Add imports and state**

Near the top of `BoardPage`, add import:
```js
import { getFenAtIndex } from '../../utils';
```

Inside the component, after the existing hooks, add:
```js
const [viewIndex, setViewIndex] = useState(null); // null = "at latest"
const [startingFen, setStartingFen] = useState(null);
```

- [ ] **Step 2: Capture starting FEN when the game is set up**

Inside the existing `useEffect(() => { if (roomId && players && fen) { ... } }, [players])`, after `dispatch(actions.resetGame())`, add:
```js
setStartingFen(fen);
setViewIndex(null);
```

- [ ] **Step 3: Compute `displayFen` and `isViewingHistory`**

After the `player`/`opponent`/`gameState` hooks:
```js
// viewIndex === null means "at latest" — use live gameFen
const isViewingHistory = viewIndex !== null && viewIndex < moveHistory.length;
const displayFen = isViewingHistory
    ? getFenAtIndex(startingFen ?? gameFen, moveHistory, viewIndex)
    : gameFen;
```

Where `gameFen` is already available from `useGameFen()` via hooks (add it if missing — check `hooks/useGameState.js`; it's exported as `useGameFen`).

Add `useGameFen` to the import from `'../../hooks'` if it's not already there.

- [ ] **Step 4: Auto-jump to latest when a new move arrives**

```js
// When opponent plays, snap back to the live position
useEffect(() => {
    setViewIndex(null);
}, [moveHistory.length]);
```

- [ ] **Step 5: Navigation handlers**

```js
const goToStart = () => setViewIndex(0);
const goBack = () => setViewIndex(v => {
    const current = v ?? moveHistory.length;
    return Math.max(0, current - 1);
});
const goForward = () => {
    setViewIndex(v => {
        const current = v ?? moveHistory.length;
        const next = current + 1;
        return next >= moveHistory.length ? null : next; // null = at latest
    });
};
const goToLatest = () => setViewIndex(null);
const goToMove = (idx) => setViewIndex(idx); // idx: 0-based move count
```

- [ ] **Step 6: Pass props to `ChessBoard` and `SidePanel`**

Update the JSX to pass:
```jsx
<Chessboard displayFen={isViewingHistory ? displayFen : undefined} />
```

And to `SidePanel`:
```jsx
<SidePanel
    viewIndex={viewIndex ?? moveHistory.length}
    onGoToStart={goToStart}
    onGoBack={goBack}
    onGoForward={goForward}
    onGoToLatest={goToLatest}
    onGoToMove={goToMove}
/>
```

Note: `SidePanel` currently takes no props — update its signature in the next task.

- [ ] **Step 7: Commit**

```bash
git add src/components/board-page/index.jsx
git commit -m "feat: add viewIndex navigation state to BoardPage"
```

---

## Task 3: Update `ChessBoard` to support history viewing

**Files:**
- Modify: `src/components/chessboard/index.jsx`

- [ ] **Step 1: Accept `displayFen` prop**

Change the `ChessBoard` function signature:
```js
const ChessBoard = ({ displayFen }) => {
```

- [ ] **Step 2: Use `displayFen` for the board position and disable moves**

The `Chessboard` (react-chessboard) currently receives `position={gameFen}`. Change to:
```jsx
position={displayFen ?? gameFen}
```

And add an `isHistory` flag to disable interaction:
```js
const isHistory = !!displayFen;
```

Update the `onDrop` handler to bail early when viewing history:
```js
const onDrop = (sourceSquare, targetSquare, piece) => {
    if (isHistory) return false;
    // ... existing logic
};
```

Update the Chessboard props:
```jsx
arePiecesDraggable={!isHistory}
```

And disable `onSquareClick` when viewing history:
```jsx
onSquareClick={gameState === GAME_STATES.playing && !isHistory ? clearAnnotations : undefined}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/chessboard/index.jsx
git commit -m "feat: disable board interaction when viewing move history"
```

---

## Task 4: Navigation UI in `SidePanel`

**Files:**
- Modify: `src/components/side-panel/index.jsx`
- Modify: `src/components/side-panel/style.css`

This task updates `SidePanel` to:
1. Accept nav props and display |< ← → >| buttons
2. Make move rows clickable and highlight the currently-viewed move
3. Keep auto-scroll working only when at latest

- [ ] **Step 1: Update `SidePanel` signature**

```jsx
const SidePanel = ({
    viewIndex,
    onGoToStart,
    onGoBack,
    onGoForward,
    onGoToLatest,
    onGoToMove,
    // action button props added in Task 6
}) => {
```

- [ ] **Step 2: Add nav controls to the move history section**

Replace the static `<h3>Moves</h3>` with a nav bar:
```jsx
<div className="move-history-header">
    <span className="moves-label">Moves</span>
    <div className="nav-controls">
        <button className="nav-btn" onClick={onGoToStart} title="Start">⏮</button>
        <button className="nav-btn" onClick={onGoBack} title="Previous">◀</button>
        <button className="nav-btn" onClick={onGoForward} title="Next">▶</button>
        <button className="nav-btn" onClick={onGoToLatest} title="Latest">⏭</button>
    </div>
</div>
```

- [ ] **Step 3: Make move rows clickable with active-move highlight**

In the `moveHistory.map` loop, add `onClick` and `data-active` to each move cell:

```jsx
{Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, idx) => {
    const whiteMoveIdx = 2 * idx + 1; // viewIndex after white move
    const blackMoveIdx = 2 * idx + 2; // viewIndex after black move
    return (
        <div className="move-history-row" key={idx}>
            <div className="move-turn">{idx + 1}.</div>
            <div
                className={`move-white${viewIndex === whiteMoveIdx ? ' move-active' : ''}`}
                onClick={() => moveHistory[2 * idx] && onGoToMove(whiteMoveIdx)}
            >
                {moveHistory[2 * idx] || ''}
            </div>
            <div
                className={`move-black${viewIndex === blackMoveIdx ? ' move-active' : ''}`}
                onClick={() => moveHistory[2 * idx + 1] && onGoToMove(blackMoveIdx)}
            >
                {moveHistory[2 * idx + 1] || ''}
            </div>
        </div>
    );
})}
```

- [ ] **Step 4: Only auto-scroll when at latest**

Change the auto-scroll effect to only scroll when `viewIndex >= moveHistory.length` (at latest):
```jsx
useEffect(() => {
    if (viewIndex >= moveHistory.length) {
        moveHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
}, [moveHistory, viewIndex]);
```

- [ ] **Step 5: Add CSS in `src/components/side-panel/style.css`**

```css
/* Nav controls row */
.move-history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
}

.moves-label {
    font-family: 'Rajdhani', Impact, sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
}

.nav-controls {
    display: flex;
    gap: 2px;
}

.nav-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-muted);
    font-size: 11px;
    padding: 3px 6px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    line-height: 1;
}

.nav-btn:hover {
    color: var(--text);
    border-color: var(--accent);
    background: var(--panel);
}

/* Active move highlight */
.move-white,
.move-black {
    cursor: pointer;
    border-radius: 3px;
    transition: background 0.1s;
}

.move-white:hover,
.move-black:hover {
    background: var(--panel-hover);
}

.move-active {
    background: var(--accent-dim) !important;
    color: var(--accent-light) !important;
    font-weight: 600;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/side-panel/index.jsx src/components/side-panel/style.css
git commit -m "feat: add move navigation controls and clickable history to SidePanel"
```

---

## Task 5: Resign and Offer Draw buttons (active game)

**Files:**
- Modify: `src/components/board-page/index.jsx`
- Modify: `src/components/side-panel/index.jsx`
- Modify: `src/components/side-panel/style.css`
- Modify: `src/components/confirm-modal/style.css`

`ConfirmModal` already exists at `src/components/confirm-modal/index.jsx` with props `{ message, onConfirm, onCancel }`. We reuse it.

- [ ] **Step 1: Add resign/draw state to `BoardPage`**

```js
const [confirmAction, setConfirmAction] = useState(null); // null | 'resign' | 'draw'
```

- [ ] **Step 2: Resign handler in `BoardPage`**

```js
const handleResign = () => setConfirmAction('resign');
const handleResignConfirm = () => {
    socket.emit('resign');
    setConfirmAction(null);
};
```

- [ ] **Step 3: Offer draw handler in `BoardPage`**

```js
const handleOfferDraw = () => setConfirmAction('draw');
const handleDrawConfirm = () => {
    socket.emit('offerDraw');
    setConfirmAction(null);
};
```

- [ ] **Step 4: Render `ConfirmModal` in `BoardPage` JSX**

Import `ConfirmModal` if not already imported:
```js
import ConfirmModal from '../confirm-modal';
```

Inside the board JSX (before `</div>`):
```jsx
{confirmAction && (
    <ConfirmModal
        message={confirmAction === 'resign'
            ? 'Are you sure you want to resign?'
            : 'Offer a draw to your opponent?'}
        onConfirm={confirmAction === 'resign' ? handleResignConfirm : handleDrawConfirm}
        onCancel={() => setConfirmAction(null)}
    />
)}
```

- [ ] **Step 5: Pass handlers to `SidePanel`**

Update `SidePanel` usage in BoardPage JSX:
```jsx
<SidePanel
    ...existing props...
    onResign={gameState === GAME_STATES.playing ? handleResign : undefined}
    onOfferDraw={gameState === GAME_STATES.playing ? handleOfferDraw : undefined}
/>
```

- [ ] **Step 6: Add action buttons section to `SidePanel`**

At the bottom of the side panel JSX (outside the bomb/move sections, always rendered):
```jsx
{(onResign || onOfferDraw) && (
    <div className="game-actions">
        {onResign && (
            <button className="action-btn action-btn--danger" onClick={onResign}>
                Resign
            </button>
        )}
        {onOfferDraw && (
            <button className="action-btn action-btn--ghost" onClick={onOfferDraw}>
                Offer Draw
            </button>
        )}
    </div>
)}
```

- [ ] **Step 7: Add action buttons CSS**

In `src/components/side-panel/style.css`:
```css
/* ── Action buttons ─────────────────────────────── */

.game-actions {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    flex-direction: column;
}

.action-btn {
    width: 100%;
    padding: 9px 12px;
    border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
    border: 1px solid transparent;
    letter-spacing: 0.02em;
}

.action-btn:hover { transform: translateY(-1px); }

.action-btn--danger {
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
}

.action-btn--danger:hover {
    background: rgba(239, 68, 68, 0.22);
    border-color: rgba(239, 68, 68, 0.55);
}

.action-btn--ghost {
    background: var(--panel);
    border-color: var(--border-strong);
    color: var(--text-muted);
}

.action-btn--ghost:hover {
    background: var(--panel-hover);
    color: var(--text);
    border-color: var(--accent);
}
```

- [ ] **Step 8: Update `confirm-modal/style.css` for dark theme**

Replace the CSS that uses old variables with dark-theme equivalents:
```css
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 12px;
    padding: 28px 36px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    color: var(--text);
    max-width: 380px;
    width: 90vw;
    text-align: center;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
}

.modal-buttons {
    margin-top: 22px;
    display: flex;
    justify-content: center;
    gap: 12px;
}

.confirm-button,
.cancel-button {
    padding: 10px 28px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
}

.confirm-button:hover,
.cancel-button:hover { transform: translateY(-1px); }

.confirm-button {
    background: rgba(239, 68, 68, 0.85);
    color: #fff;
}

.confirm-button:hover { background: #ef4444; }

.cancel-button {
    background: var(--panel);
    border: 1px solid var(--border-strong);
    color: var(--text-muted);
}

.cancel-button:hover {
    background: var(--panel-hover);
    color: var(--text);
}
```

- [ ] **Step 9: Commit**

```bash
git add src/components/board-page/index.jsx src/components/side-panel/index.jsx src/components/side-panel/style.css src/components/confirm-modal/style.css
git commit -m "feat: add resign and offer draw buttons with confirm modal"
```

---

## Task 6: Handle incoming draw offer

When the opponent offers a draw, the server emits `drawOffer` to the other player. The receiving player sees a modal to accept or decline.

**Files:**
- Modify: `src/socket/boardSocketHandlers.jsx`
- Modify: `src/components/board-page/index.jsx`

- [ ] **Step 1: Add `drawOffer` and `drawOfferDeclined` handlers to `boardSocketHandlers.jsx`**

Add `setDrawOfferPending` and `setDrawOfferDeclinedMsg` to the destructured parameter:
```js
export const useBoardSocketHandlers = ({
    ...existing,
    setDrawOfferPending,    // () => void
    setDrawOfferDeclinedMsg, // (msg: string) => void
}) => {
```

Add handlers:
```js
const handleDrawOffer = () => {
    setDrawOfferPending(true);
};

const handleDrawOfferDeclined = () => {
    setDrawOfferDeclinedMsg('Your draw offer was declined.');
};
```

Return them:
```js
return {
    ...existing,
    handleDrawOffer,
    handleDrawOfferDeclined,
};
```

- [ ] **Step 2: Wire socket events in `BoardPage`**

Add state:
```js
const [drawOfferPending, setDrawOfferPending] = useState(false);
const [drawOfferDeclinedMsg, setDrawOfferDeclinedMsg] = useState('');
```

Add to `useBoardSocketHandlers` call:
```js
const { ..., handleDrawOffer, handleDrawOfferDeclined } = useBoardSocketHandlers({
    ...existing,
    setDrawOfferPending,
    setDrawOfferDeclinedMsg,
});
```

Register in the `useEffect`:
```js
socket.on('drawOffer', handleDrawOffer);
socket.on('drawOfferDeclined', handleDrawOfferDeclined);
// cleanup:
socket.off('drawOffer', handleDrawOffer);
socket.off('drawOfferDeclined', handleDrawOfferDeclined);
```

Draw response handlers:
```js
const handleAcceptDraw = () => {
    socket.emit('drawResponse', { accepted: true });
    setDrawOfferPending(false);
};
const handleDeclineDraw = () => {
    socket.emit('drawResponse', { accepted: false });
    setDrawOfferPending(false);
};
```

- [ ] **Step 3: Show draw offer modal in `BoardPage` JSX**

```jsx
{drawOfferPending && (
    <ConfirmModal
        message="Your opponent offers a draw. Accept?"
        onConfirm={handleAcceptDraw}
        onCancel={handleDeclineDraw}
    />
)}
{drawOfferDeclinedMsg && (
    <ConfirmModal
        message={drawOfferDeclinedMsg}
        onConfirm={() => setDrawOfferDeclinedMsg('')}
        onCancel={() => setDrawOfferDeclinedMsg('')}
    />
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/socket/boardSocketHandlers.jsx src/components/board-page/index.jsx
git commit -m "feat: handle incoming draw offer with accept/decline modal"
```

---

## Task 7: Rematch and New Game buttons (post-game)

**Files:**
- Modify: `src/components/board-page/index.jsx`
- Modify: `src/socket/boardSocketHandlers.jsx`
- Modify: `src/components/side-panel/index.jsx`

- [ ] **Step 1: Add rematch state and handlers to `BoardPage`**

```js
const [rematchOffered, setRematchOffered] = useState(false); // opponent offered
const [rematchRequested, setRematchRequested] = useState(false); // we offered
```

```js
const handleRequestRematch = () => {
    socket.emit('requestRematch');
    setRematchRequested(true);
};
const handleNewGame = () => navigate('/');
```

- [ ] **Step 2: Handle `rematchOffered` and `rematchReady` in `boardSocketHandlers.jsx`**

Add `setRematchOffered` and `onRematchReady` to the parameter:
```js
export const useBoardSocketHandlers = ({
    ...existing,
    setRematchOffered,
    onRematchReady,
}) => {
```

```js
const handleRematchOffered = () => setRematchOffered(true);

// rematchReady fires when both players accepted — server sends new game data
const handleRematchReady = (gameData) => onRematchReady(gameData);
```

Return and register them in `BoardPage` exactly like other events.

- [ ] **Step 3: Handle `rematchReady` in `BoardPage`**

```js
const onRematchReady = ({ roomId, players, fen, secsToPlaceBomb, secsToPlay }) => {
    // Navigate to board-page with new game data — this triggers a full re-mount
    navigate('/board', {
        state: { roomId, players, fen, secsToPlaceBomb, secsToPlay },
        replace: true,
    });
};
```

- [ ] **Step 4: Pass post-game buttons to `SidePanel`**

When `gameState === GAME_STATES.game_over`, pass:
```jsx
<SidePanel
    ...existing...
    onRequestRematch={gameState === GAME_STATES.game_over ? handleRequestRematch : undefined}
    onNewGame={gameState === GAME_STATES.game_over ? handleNewGame : undefined}
    rematchRequested={rematchRequested}
    rematchOffered={rematchOffered}
/>
```

- [ ] **Step 5: Render post-game buttons in `SidePanel`**

In the `game-actions` section, add the post-game branch:
```jsx
{(onRequestRematch || onNewGame) && (
    <div className="game-actions">
        {onRequestRematch && (
            <button
                className={`action-btn action-btn--ghost${rematchRequested ? ' action-btn--waiting' : ''}`}
                onClick={onRequestRematch}
                disabled={rematchRequested}
            >
                {rematchRequested ? 'Waiting...' : rematchOffered ? 'Accept Rematch' : 'Rematch'}
            </button>
        )}
        {onNewGame && (
            <button className="action-btn action-btn--ghost" onClick={onNewGame}>
                New Game
            </button>
        )}
    </div>
)}
```

When `rematchOffered` is true AND the player hasn't requested yet, the button label changes to "Accept Rematch" — clicking it emits `requestRematch`, which is treated as acceptance by the backend.

- [ ] **Step 6: Add `.action-btn--waiting` CSS**

```css
.action-btn--waiting {
    opacity: 0.55;
    cursor: default;
    transform: none !important;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/board-page/index.jsx src/socket/boardSocketHandlers.jsx src/components/side-panel/index.jsx src/components/side-panel/style.css
git commit -m "feat: add rematch and new game buttons for post-game state"
```

---

## Task 8: Write backend notes file

- [ ] **Step 1: Write `GAME_CONTROLS.md` to the backend repo**

File path: `/Users/ange/repos/minesweeper-chess-backend/GAME_CONTROLS.md`

Content is written in the companion backend file (see below).

- [ ] **Step 2: Commit in backend repo**

```bash
cd /Users/ange/repos/minesweeper-chess-backend
git add GAME_CONTROLS.md
git commit -m "docs: add game controls socket event spec for frontend integration"
```

---

## Manual QA Checklist

After all tasks are complete, verify in-browser:

- [ ] |< ← → >| buttons render in the side panel move history header
- [ ] Clicking ← shows the previous board position; moves are blocked on that position
- [ ] Clicking → advances; at latest position, moves are re-enabled
- [ ] Clicking a move row in history jumps to that position
- [ ] When opponent makes a move, board snaps back to the latest position
- [ ] Resign button shows confirm modal; Yes emits `resign`; No closes modal
- [ ] Offer Draw shows confirm modal; Yes emits `offerDraw`
- [ ] When `drawOffer` is received, a modal with Accept/Decline appears
- [ ] Declining sends `drawResponse { accepted: false }` and dismisses modal
- [ ] After game over, Rematch and New Game buttons appear
- [ ] Clicking New Game navigates to `/`
- [ ] Clicking Rematch shows "Waiting..." until opponent also clicks
- [ ] If opponent clicks Rematch first, button label shows "Accept Rematch"
