# 007 - Adopt dre `main`'s web API

Refactoring spec (no user story). The site was written against dre v0.4.0's
`WebSession`; `main` has a smaller API and draws its own footer. The site
renders the editor and nothing else.

## Technical Design

### Decisions

- **API the site targets** (`slickroot/dre` `main`, next release after v0.4.0):
  `new WebSession()`, `press_key(key)`, `svg(cols, rows)`, `free()`.
  Gone since v0.4.0: `on_change` callback, `extent()`, `svg`'s extent
  arguments, status-line methods, the idle timer.
- **Canvas fits the fake terminal exactly.** The grid is derived from the size
  of `.screen`, not a constant: `cols = floor(screenW / cellW)`,
  `rows = floor(screenH / cellH)`, passed to `svg(cols, rows)`. dre centres the
  diagram and draws its footer inside that grid.
  - Cell size in pixels is measured once by calling `svg()` on a probe grid
    and reading the `viewBox` (`cellW = vbW / cols`, `cellH = vbH / rows`).
    Verified against dre `main`: the root `<svg>` has `width`, `height` and
    `viewBox` all equal to `cols × 8` by `rows × 16`, so today the cell is
    8 × 16 px at 1:1. The probe avoids hard-coding dre's constants.
  - A `ResizeObserver` on `.screen` recomputes the grid and redraws. The
    session is untouched, so the diagram survives a resize.
  - `.screen` has `padding: 12px` and `background: var(--editor)` (`#0a0b0d`,
    dre's own background); the grid is fitted to the content box, so the
    padding is subtracted from the measured size.
  - The SVG renders 1:1 with the panel: the `height: 100%` / `width: auto`
    scaling CSS on `#canvas svg` goes away.
  - No minimum size. When the panel is smaller than the demo diagram
    (58 × 10 cells plus footer), the diagram is clipped; accepted, small
    screens are out of scope for now. A visitor's diagram that outgrows the
    grid is clipped the same way.
- **No site bars under the editor.** The bottom strip is removed entirely:
  box counter, `plan.dre` label, dirty marker (`[+]` / `written`) and the
  shortcut hint. dre's own footer (mode, filename) is the only status shown.
  The box counter is dropped, not reimplemented: the API exposes no box count
  and counting `<rect>` is unreliable now that glows, tiles and the footer
  also emit rects. Specs 005 (insert-mode strip) and 006 (accurate counter)
  are superseded; 006 moves to `archive/`.
- **The session is named `dre-diagram`.** `fresh()` presses `n`, the name and
  Enter on every new session, so dre's footer shows the filename instead of
  `[no name — press n to name it]`, in the demo and in "Try it".
- **`term-bar` stays** (spec 002's window chrome above the canvas), as do the
  border and the "Try it" / "Watch the demo" button.
- **Release source unchanged.** `scripts/fetch-dre.mjs` still fetches
  `releases/latest`; the site change is buildable once dre tags a release
  containing this API. Until then, `dist/` and `.dre-web-types/` are copied
  from a local dre build.

### Components (within `src/main.ts`)

- **Session** — `fresh()` frees the old session and does `session = new WebSession()`.
  No callback, so no `next === session` guard.
- **Renderer** — `draw()` takes no arguments: `canvas.innerHTML =
  session.svg(cols, rows)` using the current fitted grid, then sets the
  `--bg` / `--ink` CSS variables. Owns the cell-size measurement and the
  `ResizeObserver` on `.screen`, which updates `cols` / `rows` and calls
  `draw()`. Removed: `extent()` calls, canvas growth, the `<rect` regex,
  `marker`, `countEl`, `dirtyEl`.
- **Input** — `onKey` maps the key, calls `press_key`, then `draw()`. Removed:
  `inInsert`, `COMMAND_HINT` / `INSERT_HINT`, the hint text updates.
- **Demo** — `SCRIPT` and `play()` unchanged, minus the `"written"` / `"[+]"`
  arguments and the extent probe session (the grid no longer depends on the
  script). Reduced-motion path unchanged.

### Collaborators

- dre's `WebSession` (`dre_web.js`, `dre_web_bg.wasm`, `.d.ts`), fetched by
  `scripts/fetch-dre.mjs`.

### Changes to the repo

- `src/main.ts`: as above.
- `index.html`: remove the strip's `#dirty`, `#hint`, `#count` (and the strip
  itself, with its CSS); keep `.term-bar`. Remove the `#canvas svg` scaling
  rules and drop `.screen`'s padding if it makes the grid not line up with
  the panel edge.
- `package.json`: drop `CNAME` from both `cp` commands. The last commit
  deleted the file, so `pnpm build` currently fails at that copy.
- Refresh `.dre-web-types/` (still the v0.4.0 copy) so `tsc` checks against
  the new API.
- Move `docs/specs/006-accurate-box-counter.md` to `docs/specs/archive/`.
