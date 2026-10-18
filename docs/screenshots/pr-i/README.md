# PR-I — Documents, labels and fields (Figma)

Captured at 1440 / 1024 / 390 px, light and dark, for labels, recognized fields, documents library (D12 grouped label card), saved views (D10 description, counts, pin), and document detail (D4 field value cards, D8 file size).

Seed synthetic data, then capture (API and web dev servers must match this branch):

```bash
node scripts/seed-labels-screenshots.mjs
node tools/screenshots/figma-pr-i/capture.mjs
```

Environment: `WEB_BASE`, `SCREENSHOT_USER_EMAIL`, `SCREENSHOT_USER_PASSWORD`, `SCREENSHOT_DIR`, `DATABASE_URL` (for seed).
