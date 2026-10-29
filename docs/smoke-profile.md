# Compose smoke profile

PR CI and local smoke tests use a dedicated Compose **profile** so the main `docker-compose.yml` stays unchanged (avoids merge conflicts with parallel feature work).

## Run locally

```bash
pnpm smoke
# equivalent:
bash scripts/ci/smoke.sh
```

Stack files:

- `docker-compose.yml` — base services
- `docker-compose.ci.yml` — no Ollama model pull (CPU-friendly)
- `docker-compose.smoke.yml` — extractive cited-chat env + `smoke-seed` one-shot

The `smoke` profile starts the usual API/worker/web stack, then runs `tools/smoke-bench/seed-and-verify.mjs`, which:

1. Uploads nine synthetic fixtures from `tools/smoke-bench/fixtures/` (PDF, DOCX, scanned PDF for OCR).
2. Waits up to four minutes per document for extraction to finish.
3. Sends three library chat questions (fact, count-style, out-of-scope) and asserts HTTP 200, no generation error, citations or abstention as expected.

Fixtures are non-personal; regenerate with:

```bash
node tools/smoke-bench/generate-fixtures.mjs
```

## Deployment flag

For optional smoke validation after deploy, set `DOCUVATE_SMOKE_SEED=1` and run Compose with `--profile smoke` using the same override files as above. The seeder exits non-zero on failure so orchestrators can treat it as a health gate.

## Branch protection

Configure GitHub required checks to **only** `ci-ok`. Path-filtered and migration-only jobs may show as skipped; `ci-ok` treats skipped as success.

## Worker load tests

The worker HTTP throughput bench and the 2 GiB count-based compose soak are not part of smoke. They run in the separate `worker-load` CI job (in parallel to smoke, only when worker, compose, or CI workflow paths change):

```bash
bash scripts/ci/worker-load.sh
```

## worker-load gating

`worker-load` runs on PRs only when worker, bench, compose, or `scripts/ci/worker-load.sh` paths change; editing `.github/workflows/ci.yml` alone does not trigger it. Every push to `main` runs it, so changes to the job definition are covered there.
