#!/usr/bin/env bash
# End-to-end smoke: compose stack + synthetic fixture seeder + cited-chat checks (CPU extractive).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.ci.yml -f docker-compose.smoke.yml)

bash scripts/ci/github-actions-docker-mirror.sh
bash scripts/ci/docker-login-hub.sh

for attempt in 1 2 3 4 5; do
  if "${COMPOSE[@]}" --profile smoke up --wait --build \
    postgres migrate db-storage-guard minio minio-init valkey mailpit api worker web smoke-seed; then
    exit 0
  fi
  if [ "$attempt" -eq 5 ]; then
    "${COMPOSE[@]}" logs api worker smoke-seed
    exit 1
  fi
  echo "compose smoke up failed (attempt ${attempt}), retrying..."
  "${COMPOSE[@]}" --profile smoke down -v 2>/dev/null || true
  sleep $((attempt * 15))
done
