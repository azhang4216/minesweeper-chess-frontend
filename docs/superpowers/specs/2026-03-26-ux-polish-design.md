# UX Polish Design — Landmine Chess
**Date:** 2026-03-26
**Status:** Approved

## Overview

A full UX/UI polish pass to make Landmine Chess feel fun, quirky, nerdy, meme-able, and viral -- while staying elegant and clean. The game sits at the intersection of cerebral chess and chaotic explosions; the design leans into the chaos and drama while maintaining a minimal, controlled baseline.

**Direction:** Chaos Terminal (B) + Quirky & Shareable (C), kept elegant and clean.
**Approach:** Define a system-wide personality language, then apply it surgically to the 6 highest-impact cinematic moments.

---

## Section 1 — Personality System

### Copy Voice

Dry, deadpan, chess-nerd self-aware. Never try-hard. Never cringe. The game knows what it is and finds it funny.

| Moment | Line |
|--------|------|
| Matchmaking | "Searching for someone to humiliate..." |
| Opponent found | "Opponent found. They have no idea." |
| Bomb placement header | "Plant your surprises." |
| Bomb placement subtext | "They won't see it coming." |
| Win | "Clean. Calculated. Deadly." |
| Win subtext | "+24 ELO. They never stood a chance." |
| Loss | "Their mines were better placed." |
| Loss subtext | "Touch grass and try again. -18 ELO" |
| Draw | "A gentleman's agreement..." |
| Draw subtext | "...to be mediocre together." |
| Illegal move | "That's not how any of this works." |
| Opponent disconnects | "Your opponent rage-quit." |
| Opponent disconnects subtext | "Waiting 30s for their dignity to return." |

ELO numbers in all copy are dynamic and filled in at render time.

### Motion Principle — Controlled Escalation

The UI is calm by default. Drama is earned, not constant. Four states:

1. **Default** -- quiet, focused, almost still. Minimal animation.
2. **Tension** -- slow amber pulse. Something is coming.
3. **Release** -- explosive, full-screen moment. The payoff.
4. **Recovery** -- snaps back fast. Clean again.

The contrast between the quiet baseline and the release moments is what makes the explosions hit harder. Never let the UI be "always dramatic."

### Color Moments

Color is reserved. When it appears, it means something.

| State | Color | Usage |
|-------|-------|-------|
| Normal play | Purple (`#7c3aed`) | Accent baseline |
| Time pressure (≤30s) | Amber (`#f59e0b`) | Bleeds in gradually |
| Detonation | Red (`#ef4444`) + white flash | Full-screen moment |
| Victory | Green (`#22c55e`) | Win screen wash |
| Defeat | Desaturated | Muted palette, red accents |
| King detonation | Gold (`#f59e0b`) | Royal treatment only |

---

## Section 2 — The 6 Cinematic Moments

### ① Bomb Detonation (Regular Pieces)

**Trigger:** Any non-King piece steps on a mine.
**Duration:** 1.5 seconds.
**Timer behavior:** Keeps running. The detonation resolves as a move; it is always the other player's clock ticking during the animation. This preserves the chaos and rewards players who already have a plan.

**Sequence:**
1. Full-board dark overlay fades in instantly (black, ~70% opacity)
2. Expanding shockwave rings animate outward from the detonated square
3. Piece name (line 1) fades in center-screen, bold, high contrast
4. Flavor text (line 2) fades in below, smaller, muted color
5. Hold for ~1s
6. Overlay dissolves; board snaps back to clean state with crater persisted

**Per-piece flavor texts:**

| Piece | Line 1 | Line 2 |
|-------|--------|--------|
| ♕ Queen | QUEEN HAS LEFT THE CHAT | She had the whole board. Chose poorly. |
| ♗ Bishop | BISHOP.EXE CRASHED | The diocese is devastated. |
| ♘ Knight | KNIGHT DOWN. NOT A DRILL. | Horse go boom. |
| ♖ Rook | THE TOWER HAS FALLEN | As it was foretold. |
| ♙ Pawn | A pawn died doing its job. | Nobody will remember. |

Line 1 is always all-caps, centered, ~18-20px, white. Line 2 is sentence case, ~11px, muted red.

**Implementation note:** A full-board overlay div sits above the chessboard in the DOM, hidden by default (`opacity: 0`, `pointer-events: none`). On detonation, it becomes visible with the animation sequence, then hides again. Shockwave rings are CSS keyframe animations on absolutely-positioned divs. The existing explosion GIF is replaced by this system.

---

### ② Bomb Detonation (King)

**Trigger:** The King steps on a mine. This ends the game.
**Duration:** 3 seconds.
**Timer behavior:** Irrelevant -- game over.

This is the most dramatic moment in the game. It gets its own visual language: gold (royal) instead of red, a full board blackout instead of just an overlay, and it bridges directly into the Game Over screen with no separate transition.

**Sequence:**
1. Board fully blacks out (immediate, hard cut)
2. Three gold concentric rings pulse outward from center
3. 👑💥 emoji pair fades in
4. "THE KING IS DEAD" appears (gold, 10px, letter-spacing: 4px)
5. "Your Majesty has left the building." appears below (white, 16px, bold)
6. Hold for ~2s
7. Cross-fades directly into the Game Over screen (green or red depending on perspective)

**Note:** Both players see the same King detonation cinematic (the animation itself is color-neutral gold/black). The difference is the transition target: winner cross-fades into the green Victory screen; loser cross-fades into the desaturated Defeat screen. The cinematic plays for whichever King was detonated -- if your King is blown up, you see your own King's cinematic then the Defeat screen.

---

### ③ Match Found

**Trigger:** Server matches two players; currently navigates silently to the board.
**Duration:** ~2 seconds overlay before board appears.

**Design:** A brief dramatic overlay renders on top of the board before it becomes interactive. Sets the tone before a single move is made.

**Contents:**
- "⚡ MATCH FOUND ⚡" in small purple caps
- Both player avatars (initials in a circle) + usernames + ratings side by side
- "VS" separator (muted, lightweight)
- Opponent subtext: "They have no idea."
- Countdown pill: "GAME STARTS IN 3..."

Overlay auto-dismisses after countdown. No user interaction required.

**Implementation note:** Rendered as an overlay div in `BoardPage` that shows when `gameState === 'MATCHING' → 'PLACING_BOMBS'` transition fires. Driven by existing socket events.

---

### ④ Bomb Placement Ritual

**Trigger:** `gameState === 'PLACING_BOMBS'`
**Goal:** Make this phase feel like espionage, not a form.

**Changes:**
- `placing-bombs` class added to the `BoardPage` root div; scoped CSS under that class shifts `--accent` to amber (`#f59e0b`) and adds a warm dark tint (`#0a0800`) to the board background
- Side panel header changes from neutral text to: "Plant your surprises."
- Subtext below: "They won't see it coming."
- Countdown clock (existing `placingBombsSeconds`) rendered large and prominent: monospace, ~40px, amber color
- Bomb slots shown as a row of icons: 💣 for placed, dashed bordered square for empty
- Slot count copy: "2 of 3 placed" (replaces the current text)
- Board squares in legal placement zones (ranks 3-4 for White, 5-6 for Black) pulse with a subtle amber glow (`box-shadow` on the `[data-square]` elements)

---

### ⑤ Game Over Screen

**Trigger:** `gameState === 'GAME_OVER'`; currently rendered as a popup modal (`WinLossPopup`).
**Change:** Convert from a centered modal to a full-screen takeover. Designed to be screenshotted and shared.

**Win state:**
- Background washes to deep green (`#050e08`)
- Header: "VICTORY" (small caps, green, letter-spacing)
- Piece icon (king emoji or chess piece SVG) centered
- Tagline: "Clean. Calculated. Deadly."
- Subtext: "Your mines were better placed."
- ELO change displayed large and prominent: `+24 ELO` in green, `→ 1866` muted beside it
- Buttons: "Rematch", "New Game →"

**Loss state:**
- Background desaturated (palette muted, ~50% saturation)
- Header: "DEFEAT" (small caps, muted red)
- Tagline: "Their mines were better placed."
- Subtext: "Touch grass and try again. -18 ELO"
- ELO change: `-18 ELO` in red, `→ 1824` muted
- Buttons: "Rematch", "New Game →"

**Draw state:**
- Background neutral dark
- Header: "DRAW"
- Tagline: "A gentleman's agreement..."
- Subtext: "...to be mediocre together."
- No ELO change shown (or `±0`)

**Shared layout rules:**
- No backdrop blur or shadow -- full bleed, edge to edge
- Slide-up entrance animation (0.3s, cubic-bezier), replacing existing popup scale animation
- ELO number is the largest text element after the tagline -- it's the shareable stat
- Rematch button becomes "Waiting..." then "Accept Rematch" (existing logic preserved)

**Implementation note:** `WinLossPopup` component is refactored in place -- same Redux-connected props, same rematch/new-game handlers. Only the presentation layer changes from a fixed-width modal to a full-screen div.

---

### ⑥ Critical Timer

**Trigger:** Player's clock reaches ≤5 seconds.
**Current behavior:** Only the timer number pulses red in isolation.
**New behavior:** The whole board environment reacts.

**Sequence (graduated):**
- ≤30s: existing amber warning state (unchanged)
- ≤10s: existing red pulse state (unchanged)
- ≤5s (new): red vignette bleeds in from edges of the entire board container; background of board area shifts to dark red; board squares dim slightly (~15% darker overlay); timer number grows in size; existing pulse animation intensifies

The vignette is a CSS radial gradient overlay (`position: absolute`, `pointer-events: none`) on the board container. It transitions in over 0.5s so it doesn't feel like a jump cut.

---

## Architecture Notes

All changes are CSS + React component additions. No backend changes required.

| Moment | Files Affected |
|--------|---------------|
| Detonation overlay | `chessboard/index.jsx`, `chessboard/style.css` |
| King detonation | `board-page/index.jsx`, new `detonation-overlay/` component |
| Match found overlay | `board-page/index.jsx`, new `match-found-overlay/` component |
| Bomb placement | `side-panel/style.css`, `side-panel/index.jsx`, `board-page/style.css` |
| Game over screen | `win-loss-popup/index.jsx`, `win-loss-popup/style.css` |
| Critical timer vignette | `chessboard/style.css`, `timer/style.css` |
| Copy voice | Inline strings throughout; no i18n system needed |

No new dependencies required. All animation via CSS keyframes.

---

## What This Is Not

- No new game mechanics
- No backend changes
- No new routes or pages
- No third-party animation libraries
- No changes to move validation, socket protocol, or Redux state shape
