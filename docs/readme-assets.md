# README assets (logo and previews)

Community README branding lives under `docs/assets/logo/`. App screenshots are maintained separately when UI and theming are stable.

## Verify linked assets

```bash
node scripts/verify-readme-assets.mjs
```

## Regenerate logo raster and social preview

```bash
node tools/readme/export-logo-assets.mjs
```

## Render README markdown previews (Playwright)

```bash
node tools/readme/render-readme-preview.mjs
```

Optional: `README_RENDER_SHA=<git-sha>` loads repo assets from `raw.githubusercontent.com` instead of a local static server.

## Screenshot pipeline (follow-up PRs)

With the stack running locally:

```bash
node tools/readme/seed-readme-screenshots.mjs
node tools/readme/capture-readme-screenshots.mjs
```

Then re-run `node scripts/verify-readme-assets.mjs` after PNGs are wired back into `README.md`.
