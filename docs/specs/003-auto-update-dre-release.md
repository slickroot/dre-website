# 003 - Auto-update to the latest dre release

## User Story

The dre website always shows the newest dre release from slickroot/dre. A daily check picks up a new release and publishes it to the website by itself, so I don't copy files by hand.

## Acceptance Criteria

- The website checks for a new dre release once a day.
- When a new release exists, the website is updated to it automatically, with no approval step.
- If the check or download fails, the website keeps working with the version it already has, and there is no notification.

## Technical Design

### Decisions

- **One component:** a GitHub Actions workflow, `.github/workflows/update-dre.yml`, with the logic inline in its `run` steps (no separate script).
- **Trigger:** `schedule` (daily cron, 06:00 UTC) plus `workflow_dispatch` for manual runs. The commit to `main` is the job's output, not its trigger.
- **Source:** the `dre-web.zip` asset of the latest release of `slickroot/dre` (flat zip: `dre_web.js`, `dre_web_bg.wasm`, and two `.d.ts` files). Fetched with `gh release` / the GitHub API.
- **Only two files ship:** `dre_web.js` and `dre_web_bg.wasm`. The `.d.ts` files are type-only, never loaded by the browser, so they are dropped from the zip extraction and deleted from `pkg/`.
- **Version memory:** `pkg/VERSION`, a one-line file holding the release tag (e.g. `v0.4.0`). Seeded with the tag matching the current `pkg/` files.
- **Publishing:** the job commits `pkg/` and `pkg/VERSION` straight to `main` (no PR, no approval). GitHub Pages serves from the `main` branch root, so the commit publishes the site; no deploy step is needed.
- **No-op days:** if the latest tag equals `pkg/VERSION`, the job commits nothing.

### Job flow

1. Read the latest release tag of `slickroot/dre`.
2. Compare it with `pkg/VERSION`; stop if equal.
3. Download `dre-web.zip` and unzip into a temp directory.
4. Check that `dre_web.js` and `dre_web_bg.wasm` exist and are non-empty.
5. Only then replace them in `pkg/`, write the new tag to `pkg/VERSION`, commit, and push to `main`.

### Failure handling

- Any failure (API call, download, unzip, missing file) leaves `pkg/` untouched, so the site keeps the version it already has.
- The job exits green on failure and logs the reason in the run output, so GitHub sends no failure email (no notification).
- Because work happens in a temp directory and `pkg/` is written only after validation, a failure can never leave a half-updated site.

### Collaborators

- GitHub Releases API for `slickroot/dre` (public repo, read-only).
- GitHub Pages, serving from `main`.
- Workflow needs `contents: write` permission to push the commit.

### Changes to the repo

- Add `.github/workflows/update-dre.yml`.
- Add `pkg/VERSION`.
- Delete `pkg/dre_web.d.ts` and `pkg/dre_web_bg.wasm.d.ts`.
