#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
# Capture API + worker logs and in-flight document extraction rows after a smoke hang/failure.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

OUT="${EXTRACT_STACK_LOG_DIR:-$ROOT/extract-stack-logs}"
mkdir -p "$OUT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.ci.yml -f docker-compose.smoke.yml)

{
  echo "=== compose ps ==="
  "${COMPOSE[@]}" --profile smoke ps -a || true
  echo
  echo "=== documents queued/extracting/failed ==="
  "${COMPOSE[@]}" --profile smoke exec -T postgres \
    psql -U docuvate -d docuvate -c \
    "SELECT id, status, left(coalesce(extraction_failure_reason, ''), 160) AS reason, updated_at
     FROM documents
     WHERE status IN ('queued', 'extracting', 'failed')
     ORDER BY updated_at DESC
     LIMIT 50;" || true
} >"$OUT/extract-status.txt" 2>&1 || true

"${COMPOSE[@]}" --profile smoke logs --no-color --timestamps --tail=4000 api \
  >"$OUT/api.log" 2>&1 || true
"${COMPOSE[@]}" --profile smoke logs --no-color --timestamps --tail=4000 worker \
  >"$OUT/worker.log" 2>&1 || true

echo "Wrote extract stack logs to $OUT"
ls -la "$OUT"
