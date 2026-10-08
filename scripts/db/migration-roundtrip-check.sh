#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

pnpm --filter @docuvate/api build

echo "Roundtrip: migrate → revert incremental → baseline blocked → force revert → migrate"
bash scripts/db/typeorm-cli.sh migrate

while true; do
  count="$(psql "$DATABASE_URL" -tAc "SELECT count(*)::int FROM migrations" | tr -d '[:space:]')"
  if [[ "$count" -le 1 ]]; then
    break
  fi
  bash scripts/db/typeorm-cli.sh revert
done

if bash scripts/db/typeorm-cli.sh revert 2>/dev/null; then
  echo "Expected baseline revert to be refused" >&2
  exit 1
fi

bash scripts/db/typeorm-cli.sh revert --force-baseline
bash scripts/db/typeorm-cli.sh migrate

echo "Generate-check (entities vs schema)"
bash scripts/db/migration-generate-check.sh

echo "Migration roundtrip OK"
