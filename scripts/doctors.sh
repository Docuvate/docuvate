#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== nestjs-doctor (api) =="
pnpm dlx nestjs-doctor@latest apps/api || true

echo "== react-doctor (web) =="
pnpm dlx react-doctor@latest apps/web || true

echo "== fastapi-doctor (worker) =="
uvx --index https://s-smits.github.io/fastapi-doctor/simple/ fastapi-doctor apps/worker --profile strict || true
