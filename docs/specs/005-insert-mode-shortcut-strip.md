# 005: Insert-mode shortcut strip

## User Story

As a visitor trying the interactive demo, when I enter insert mode by typing,
I want the shortcut strip to switch to insert-mode shortcuts so I know Esc
returns me to command mode (not just "finishes") and Enter adds a new child.

## Acceptance Criteria

- While in the interactive "Try it" demo, entering insert mode (pressing `b`,
  `s`, or `i`) replaces the shortcut strip's text with
  `Esc command mode · Enter new child`.
- Leaving insert mode (pressing Esc) switches the strip back to the existing
  command-mode shortcuts
  (`b add · s sibling · i edit · c colour · hjkl move · u undo`).
- This only applies to the interactive demo (the autoplay/pre-recorded demo
  before clicking "Try it" is unaffected).

## Technical Design

The WASM `WebSession` (from `dre_web.js`) exposes no mode getter — only
`press_key`, `svg`, and `extent` — so `src/main.ts` cannot query real mode
state. Mode is instead tracked locally with a heuristic, mirroring the
approach the autoplay's `inInsert` flag already uses for animation timing.

- A module-level `let inInsert = false;` (alongside the existing
  `interactive` state) tracks whether the interactive demo is in insert
  mode. This is scoped to `onKey()`'s concerns, separate from the autoplay's
  own local `inInsert` in `play()`.
- In `onKey()`, before/around the existing key handling:
  - `e.key === 'b' || e.key === 's' || e.key === 'i'` (exact lowercase match
    only — no shifted/uppercase variants) sets `inInsert = true`.
  - `e.key === 'Escape'` sets `inInsert = false`.
  - After updating the flag, reassign `hintEl.textContent` to `INSERT_HINT`
    or `COMMAND_HINT` accordingly. Setting is idempotent, so no guard is
    needed against redundant transitions (e.g. pressing `b` while already
    typing insert-mode text).
- `COMMAND_HINT` is captured once from `hintEl.textContent` at module init,
  keeping the existing HTML string (`index.html:124`) the single source of
  truth. `INSERT_HINT` (`"Esc command mode · Enter new child"`) is a new
  constant in `main.ts`.
- `setInteractive(true)` resets `inInsert = false` and `hintEl.textContent =
  COMMAND_HINT` when it creates the fresh session, so re-entering the
  interactive demo always starts in command mode regardless of prior state.
- The autoplay path (`play()`) is untouched — it doesn't call `onKey()` and
  never toggles `hintEl` while `interactive` is `false`, so pre-recorded
  playback is unaffected.
