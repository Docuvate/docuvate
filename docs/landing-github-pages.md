# Landing site on GitHub Pages

The public marketing site is built from `apps/site` in the private monorepo and published to the **public** repository [Docuvate/docuvate.github.io](https://github.com/Docuvate/docuvate.github.io). GitHub Free does not serve Pages from private repos; Actions billing is disabled for the org, so publishing is a **local build + git push** of static files only.

## Build output

- Fully static HTML, JS, and CSS (Vite + prerender).
- Asset paths are root-relative (`/assets/...`), suitable for `https://docuvate.github.io/` and the custom domain `https://docuvate.de/`.
- No server runtime, env files, or internal docs in the publish bundle.

## Publish script

From the monorepo root (after review):

```bash
chmod +x scripts/landing/publish-pages.sh

# Dry run: build, stage, gitleaks (no push)
scripts/landing/publish-pages.sh

# Push to docuvate.github.io (no custom domain file yet)
PUBLISH=1 scripts/landing/publish-pages.sh

# After DNS is ready for docuvate.de
INCLUDE_CNAME=1 PUBLISH=1 scripts/landing/publish-pages.sh
```

Environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PUBLISH` | `0` | Set to `1` to commit and push to `docuvate.github.io` |
| `INCLUDE_CNAME` | `0` | Set to `1` to add `CNAME` with `docuvate.de` |
| `GITHUB_PAGES_REMOTE` | `git@github.com:Docuvate/docuvate.github.io.git` | Target remote |
| `GITHUB_PAGES_CLONE_DIR` | `.cache/docuvate.github.io` | Local clone for push |
| `STAGING_DIR` | temp dir | Inspect staged output when not publishing |

The script runs **gitleaks** on the staged output before push. Do not publish if secrets are reported.

Requires **gitleaks** on your PATH (`brew install gitleaks` or see upstream releases).

### Repository rules (docuvate.github.io)

`main` has a ruleset that **blocks force pushes and branch deletion** and requires **linear history**. The publish script therefore:

1. Clones (or reuses) the public repo and `git pull --ff-only origin main`.
2. Deletes every file in the clone except `.git`, copies the new build output, adds `.nojekyll` and a short root `README.md` (source lives in the private monorepo).
3. Commits and runs `git push origin main` with **no `--force`** and **no orphan branch**.

If your local clone is behind `origin/main`, the script exits so you can `git pull --ff-only` and retry.

### Local test (no GitHub push)

```bash
chmod +x scripts/landing/test-publish-pages-local.sh
scripts/landing/test-publish-pages-local.sh
```

This creates a bare repo with an initial `main` commit (like the public README init), runs two publish cycles, and checks for `.nojekyll`, `index.html`, and linear history.

## Custom domain DNS (docuvate.de)

At your DNS provider for **docuvate.de**:

**Apex (`docuvate.de`)** — A records:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

**Apex IPv6 (recommended):**

| Type | Name | Value |
|------|------|-------|
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

**WWW:**

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `docuvate.github.io` |

In the **docuvate.github.io** repository settings → Pages: set custom domain to `docuvate.de`, then enable **Enforce HTTPS** once DNS and certificate provisioning complete.

Publish with `INCLUDE_CNAME=1` only when you want GitHub to serve the apex via the `CNAME` file in the Pages branch.

## Source of truth

- Copy, screenshots, and styles: monorepo `apps/site` on branch merged to `main`.
- Published repo contains **only** the built `dist` tree plus `.nojekyll`, root `README.md`, and optional `CNAME`.

## Legal config (before first publish)

Impressum fields live in `apps/site/legal.config.json`. Pages read this file; empty values show as “Noch nicht hinterlegt” / “Not provided yet” without inventing addresses.

`PUBLISH=1` runs `apps/site/scripts/check-legal-for-publish.mjs` and **exits** until required imprint fields (`providerName`, `street`, `postalCode`, `city`, `country`, `email`) are filled.
