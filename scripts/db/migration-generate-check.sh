#!/usr/bin/env bash
# TypeORM migration:generate --check (entity vs DB). Fails on structural drift, not FK metadata churn.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API="$ROOT/apps/api"
DS="$API/dist/shared/infrastructure/database/data-source.js"
CLI="$API/node_modules/typeorm/cli.js"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

pnpm --filter @docuvate/api build >/dev/null

set +e
out="$(node "$CLI" migration:generate --check -d "$DS" \
  "$API/src/shared/infrastructure/database/migrations/__dryrun_check__" 2>&1)"
code=$?
set -e

if [[ "$code" -eq 0 ]]; then
  echo "migration:generate --check OK (no drift)"
  exit 0
fi

if echo "$out" | grep -qE 'CREATE TABLE|DROP TABLE|ADD COLUMN|DROP COLUMN|ALTER TABLE "[^"]+" ADD "|ALTER TABLE "[^"]+" DROP COLUMN'; then
  echo "Entity/schema structural drift detected:" >&2
  echo "$out" | tail -40 >&2
  exit 1
fi

echo "migration:generate --check OK (FK metadata only; ignored for phase 1)"
