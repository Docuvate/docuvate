#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
# Worker load tests on the 2 GiB compose worker: HTTP throughput bench, then the
# count-based soak. Runs in its own CI job (worker-load), in parallel to smoke.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Local tags for compose build (avoid ghcr.io/:edge when building in CI).
source "$ROOT/scripts/ci/compose-local-image-names.sh"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.ci.yml -f docker-compose.smoke.yml)

bash scripts/ci/github-actions-docker-mirror.sh
bash scripts/ci/docker-login-hub.sh

bash scripts/ci/compose-smoke-pull-images.sh

# The worker serves /v1/extract on its own; compose starts its dependencies
# (postgres, migrate, db-storage-guard, minio). API and web are not needed.
for attempt in 1 2 3 4 5; do
  if "${COMPOSE[@]}" --profile smoke up --wait --build worker; then
    break
  fi
  if [ "$attempt" -eq 5 ]; then
    "${COMPOSE[@]}" --profile smoke logs worker
    exit 1
  fi
  echo "compose worker up failed (attempt ${attempt}), retrying..."
  "${COMPOSE[@]}" --profile smoke down -v 2>/dev/null || true
  sleep $((attempt * 15))
done

bash apps/worker/tests/scripts/worker_http_throughput_smoke.sh
bash apps/worker/tests/scripts/worker_compose_2g_soak.sh
