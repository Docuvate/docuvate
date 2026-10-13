# Smoke bench fixtures

Synthetic document bank for the Compose **`smoke`** profile (see [docs/smoke-profile.md](../../docs/smoke-profile.md)).

- `fixtures/` — committed PDF/DOCX outputs (regenerate via `node tools/smoke-bench/generate-fixtures.mjs`)
- `manifest.json` — fixture list and chat assertions
- `seed-and-verify.mjs` — upload, pipeline wait, cited-chat checks (used by `smoke-seed` service)

No personal data; all names and amounts are fictional.
