#!/usr/bin/env bash
# End-to-end smoke: compose stack + synthetic fixture seeder + cited-chat checks (CPU extractive).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Local tags for compose build (avoid ghcr.io/:edge when building in CI).
source "$ROOT/scripts/ci/compose-local-image-names.sh"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.ci.yml -f docker-compose.smoke.yml)

bash scripts/ci/github-actions-docker-mirror.sh
bash scripts/ci/docker-login-hub.sh

bash scripts/ci/compose-smoke-pull-images.sh

for attempt in 1 2 3 4 5; do
  if "${COMPOSE[@]}" --profile smoke up --wait --build \
    postgres migrate db-storage-guard minio minio-init valkey mailpit api worker web smoke-seed; then
    "${COMPOSE[@]}" --profile smoke logs smoke-seed
    bash apps/worker/tests/scripts/worker_http_throughput_smoke.sh
    exit 0
  fi
  if [ "$attempt" -eq 5 ]; then
    "${COMPOSE[@]}" --profile smoke logs api worker smoke-seed
    exit 1
  fi
  echo "compose smoke up failed (attempt ${attempt}), retrying..."
  "${COMPOSE[@]}" --profile smoke down -v 2>/dev/null || true
  sleep $((attempt * 15))
done
