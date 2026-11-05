#!/usr/bin/env bash
# Local doctor run with the same pinned CLIs as docs/testing/doctor-baseline.json
# (and scripts/testing/doctor-ratchet.mjs / nightly). Do not use @latest.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== nestjs-doctor@0.9.10 (api) =="
pnpm dlx nestjs-doctor@0.9.10 apps/api || true

echo "== react-doctor@0.9.17 (web) =="
pnpm dlx react-doctor@0.9.17 apps/web || true

echo "== fastapi-doctor==0.12.0 strict (worker) =="
(
  cd apps/worker
  uvx --from fastapi-doctor==0.12.0 \
    --index https://s-smits.github.io/fastapi-doctor/simple/ \
    fastapi-doctor --profile strict || true
)
