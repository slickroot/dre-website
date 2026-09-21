# 001 - dre on custom domain

## User Story

Doug opens his browser, goes to dre.elaich.com, and sees the dre website working.

## Acceptance Criteria

- The address shows the secure padlock (https).
- Doug sees the same page you see on localhost today.

## Technical Design

### Decisions

- **Hosting:** GitHub Pages. The site is static (`index.html` + `pkg/` WASM bundle, no build step).
- **Publishing:** Pages serves from `main` at the root (`/`). A push to `main` is the deploy. No GitHub Actions workflow. Revisit if `pkg/` stops being committed.
- **Domain:** `dre.elaich.com` is a CNAME to `slickroot.github.io`. No A records.
- **DNS provider:** GoDaddy, record added by hand. No proxy layer, so nothing to disable.
- **Setup:** done by hand in the GitHub Settings UI, no `gh api` scripting.
- **Verification:** manual, in the browser.

### Components

| Piece | Responsibility | Collaborators |
| --- | --- | --- |
| `CNAME` file (repo root, contains `dre.elaich.com`) | Tells Pages which custom domain to serve | GitHub Pages |
| GitHub Pages (`slickroot/dre-website`, `main` `/`) | Serves the static files and issues the HTTPS certificate | `main` branch, GoDaddy DNS |
| GoDaddy DNS record (`dre` CNAME to `slickroot.github.io`) | Points the domain at GitHub | GitHub Pages |

### Runbook

Order matters. The certificate is only issued once DNS resolves to GitHub, and "Enforce HTTPS" cannot be enabled before then.

1. **Commit the `CNAME` file.** Add `CNAME` at the repo root containing exactly `dre.elaich.com`, then push to `main`.
2. **Enable Pages.** GitHub, `slickroot/dre-website`, Settings, Pages. Under Build and deployment, set Source to "Deploy from a branch", Branch to `main`, folder to `/ (root)`. Save.
3. **Set the custom domain.** In the same Pages settings, enter `dre.elaich.com` under Custom domain and save. GitHub starts a DNS check, which fails until step 4 is done.
4. **Add the DNS record in GoDaddy.** Domain `elaich.com`, DNS, Add record: Type `CNAME`, Name `dre`, Value `slickroot.github.io`, TTL default.
5. **Wait for DNS and the certificate.** The Pages settings page shows "DNS check successful" first, then the certificate is provisioned. This can take from minutes up to about an hour.
6. **Enforce HTTPS.** Once the checkbox is enabled, tick "Enforce HTTPS" under the Pages settings.

### Verification (manual)

- Open `https://dre.elaich.com` in a browser.
- The address bar shows the padlock (criterion 1).
- The page and the WASM content render the same as on localhost (criterion 2).
- Opening `http://dre.elaich.com` redirects to `https`, which confirms Enforce HTTPS is on.

