# 008 - Local dre dev script

Refactoring spec (no user story). Spec 007 says that until dre tags a release
with the new web API, `dist/` and `.dre-web-types/` are "copied from a local
dre build", by hand. This spec turns that into `pnpm dev:local`.

## Technical Design

### Decisions

- **Build, then copy.** The script runs `make wasm` in the dre checkout, then
  copies the output. Output is never stale; cargo's incremental build keeps
  repeat runs cheap. Debug profile (`RELEASE` unset), which is fine for dev.
- **Finding dre.** `DRE_DIR` env var, defaulting to `~/code/dre`.
- **Branch.** Not checked. The script builds whatever the checkout has, so it
  also works against a dre feature branch.
- **One shared file list.** `RUNTIME_FILES`, `TYPE_FILES`, `DIST_DIR` and
  `TYPES_DIR` move out of `fetch-dre.mjs` into `scripts/dre-files.mjs`. Both
  fetch scripts import them, so the lists cannot drift apart.
- **Sync once, at startup.** No watcher on dre's sources. After a dre change,
  stop and rerun `pnpm dev:local`.
- **`dev:local` only.** No `build:local`. `pnpm build` stays release-only, so a
  production build can never ship an unreleased dre.
- **Failures are loud.** If `$DRE_DIR` is missing, `make wasm` fails, or an
  expected file is not in `web/pkg`, the script exits non-zero with a message
  naming the path or command. No fallback to the released dre.

### Components

- **`scripts/dre-files.mjs`** (new) — exports `RUNTIME_FILES`, `TYPE_FILES`,
  `DIST_DIR`, `TYPES_DIR`. Constants only.
- **`scripts/local-dre.mjs`** (new) — exports `useLocalDre()`:
  1. resolves `DRE_DIR` (env, else `~/code/dre`) and checks it exists;
  2. runs `make wasm` there, with output passed through;
  3. copies `RUNTIME_FILES` from `$DRE_DIR/web/pkg` into `DIST_DIR`, and
     `TYPE_FILES` into `TYPES_DIR`, creating the directories;
  4. returns `{ dir }`.
  Run directly, it calls `useLocalDre()` and logs
  `Copied local dre from <dir> into dist/ and .dre-web-types/`.
  Same shape as `fetchDre()`, so the two are interchangeable in `package.json`.
- **`scripts/fetch-dre.mjs`** — behaviour unchanged; imports the constants
  from `dre-files.mjs`.

### Collaborators

- `make wasm` in the dre repo (`nix develop`, cargo, wasm-bindgen).
- `$DRE_DIR/web/pkg/` as the build output.

### Changes to the repo

- `package.json`: add `dev:local`, identical to `dev` with
  `scripts/local-dre.mjs` in place of `scripts/fetch-dre.mjs`. `dev` and
  `build` are untouched.
- `scripts/dre-files.mjs` and `scripts/local-dre.mjs`: new.
- `scripts/fetch-dre.mjs`: import the shared constants.

### Testing

- `useLocalDre()` takes the dre directory and a command runner as arguments
  (defaults: env and `execFile`), so tests use a temp dir with fake
  `web/pkg` files and a stub runner. Cases: files copied to both destinations,
  `make wasm` invoked in the right cwd, missing directory rejects, missing
  output file rejects.
