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
- **Fixed canvas.** One `COLS × ROWS` constant in `src/main.ts`, measured once
  against the demo script: the diagram spans 58 × 10 cells, plus 4 cells of
  margin per axis, plus dre's footer (`BOX_HEIGHT` = 3 rows) => `62 × 17`.
  dre centres the diagram inside the window itself. A visitor's diagram that
  outgrows the canvas is clipped; accepted. If the demo script changes, the
  constant is re-measured by hand.
- **No site bars under the editor.** The bottom strip is removed entirely:
  box counter, `plan.dre` label, dirty marker (`[+]` / `written`) and the
  shortcut hint. dre's own footer (mode, filename) is the only status shown.
  The box counter is dropped, not reimplemented: the API exposes no box count
  and counting `<rect>` is unreliable now that glows, tiles and the footer
  also emit rects. Specs 005 (insert-mode strip) and 006 (accurate counter)
  are superseded; 006 moves to `archive/`.
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
  session.svg(COLS, ROWS)`, then sets the `--bg` / `--ink` CSS variables.
  Removed: `extent()` calls, canvas growth, the `<rect` regex, `marker`,
  `countEl`, `dirtyEl`.
- **Input** — `onKey` maps the key, calls `press_key`, then `draw()`. Removed:
  `inInsert`, `COMMAND_HINT` / `INSERT_HINT`, the hint text updates.
- **Demo** — `SCRIPT` and `play()` unchanged, minus the `"written"` / `"[+]"`
  arguments and the probe session. Reduced-motion path unchanged.

### Collaborators

- dre's `WebSession` (`dre_web.js`, `dre_web_bg.wasm`, `.d.ts`), fetched by
  `scripts/fetch-dre.mjs`.

### Changes to the repo

- `src/main.ts`: as above.
- `index.html`: remove the strip's `#dirty`, `#hint`, `#count` (and the strip
  itself, with its CSS); keep `.term-bar`.
- `package.json`: drop `CNAME` from both `cp` commands. The last commit
  deleted the file, so `pnpm build` currently fails at that copy.
- Refresh `.dre-web-types/` (still the v0.4.0 copy) so `tsc` checks against
  the new API.
- Move `docs/specs/006-accurate-box-counter.md` to `docs/specs/archive/`.
