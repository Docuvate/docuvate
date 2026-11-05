# Smoke bench fixtures

Synthetic document bank for the Compose **`smoke`** profile (see [docs/smoke-profile.md](../../docs/smoke-profile.md)).

- `fixtures/` — committed PDF/DOCX outputs (regenerate via `node tools/smoke-bench/generate-fixtures.mjs`)
- `manifest.json` — fixture list and smoke assertions
- `seed-and-verify.mjs` — upload, pipeline wait, label/field/duplicate checks (used by `smoke-seed` service)
- `realistic-ollama-stub.mjs` — compose-smoke Ollama stub (`[1]` sources, EUR quotes) so citation verification matches production qwen output

No personal data; all names and amounts are fictional.
