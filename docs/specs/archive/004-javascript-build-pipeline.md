# 004 - JavaScript build pipeline

## Technical Design

### Decisions

- **Language:** TypeScript.
- **Source layout:** one file, `src/main.ts`. No module split — the demo's responsibilities (WASM session lifecycle, key-input mapping, SVG rendering, scripted-demo playback) stay in one file, divided by clearly labelled comment separators, not by file boundaries. This is the seed of the future editor; splitting is deferred until the editor actually lives here.
- **Bundler:** esbuild, bundling `src/main.ts` into a single minified **IIFE** — a plain `<script src="dist/main.js">` drop-in, no `type="module"`, no import maps.
- **Type-check gate:** `tsc --noEmit` runs as part of `pnpm build` (and CI) and fails the build on type errors. esbuild itself does not type-check.
- **Types for the WASM API:** the `.d.ts` files (`dre_web.d.ts`, `dre_web_bg.wasm.d.ts`) shipped in `slickroot/dre`'s `dre-web.zip` are fetched at build time to type `WebSession` and friends. They are compile-time only and never copied into `dist/`.
- **Package manager:** pnpm, with dependency install/build scripts disabled by default (pnpm's default script-blocking behavior), as a supply-chain mitigation. Nothing runs a postinstall script without explicit approval.
- **Local dev toolchain:** a `flake.nix` provides Node, pnpm, esbuild, and `tsc` via `nix develop`, so local dev doesn't depend on globally installed tooling.
- **pnpm scripts:**
  - `pnpm dev` — esbuild in watch mode, unminified, with a sourcemap, for local debugging.
  - `pnpm build` — the single, reproducible command that produces a fully servable `dist/`: runs `tsc --noEmit`, bundles+minifies `src/main.ts` with esbuild (no sourcemap), fetches the latest `slickroot/dre` release's `dre_web.js`/`dre_web_bg.wasm` (and, transiently, its `.d.ts` for the type-check step), and copies `index.html`, favicons, and `CNAME` into `dist/`. Runs identically locally and in CI.
- **Build output:** `dist/`, gitignored — never committed. It only ever exists as a local build artifact or a CI-produced deploy artifact.
- **`pkg/` and `pkg/VERSION` are removed entirely.** No version is tracked in git any more; the latest dre release is fetched fresh into `dist/` on every build. This retires spec 003's "commit to main" model.
- **CI/deploy:** a single GitHub Actions workflow (replacing spec 003's `update-dre.yml`) that:
  1. Triggers on `push` to `main`, a daily `schedule`, and `workflow_dispatch`.
  2. Installs Nix via `cachix/install-nix-action`.
  3. Runs `pnpm build` inside the flake's dev shell (`nix develop -c pnpm build`).
  4. Uploads `dist/` as a Pages artifact and deploys it via `actions/deploy-pages` — GitHub Pages no longer serves the raw `main` branch root.
- **Production guarantee:** the deployed site only ever loads the minified `dist/main.js` (and the fetched `dre_web.js`/`dre_web_bg.wasm`) — no sourcemaps, no `.d.ts`, no unminified source ship to the browser.

### Components (within `src/main.ts`)

- **Session section** — owns the `WebSession` instance lifecycle: create, `free()` on replacement, re-create on demo restart. Collaborates with the fetched `dre_web.js` WASM bindings.
- **Input section** — maps `keydown` DOM events to `dre` keystrokes and forwards them to the active session.
- **Renderer section** — reads `session.svg()`/`session.extent()` and updates the `#canvas`, `#count`, `#dirty` DOM elements.
- **Demo section** — owns the scripted keystroke playback loop (`SCRIPT`, timers) used before a visitor goes interactive.

### Collaborators

- `slickroot/dre`'s GitHub Releases API — source of `dre_web.js`, `dre_web_bg.wasm`, and their `.d.ts` files, fetched at build time only.
- `cachix/install-nix-action` + the repo's `flake.nix` — toolchain provider for both local dev and CI.
- `actions/deploy-pages` — publishes the `dist/` artifact to GitHub Pages.

### Changes to the repo

- Add `flake.nix` (+ lockfile), `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.npmrc` (script-blocking config).
- Add `src/main.ts`, ported from the current inline `<script type="module">` in `index.html`.
- `index.html`: replace the inline script with `<script src="main.js"></script>` (or equivalent relative path resolved by the build).
- Add `dist/` to `.gitignore`.
- Delete `pkg/` (including `pkg/VERSION`).
- Replace `.github/workflows/update-dre.yml` with a single new workflow (e.g. `.github/workflows/deploy.yml`) implementing the build+deploy flow above.

