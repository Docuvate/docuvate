#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="$(cd "${WORKER_ROOT}/../.." && pwd)"
COMPOSE=(
  docker compose
  -f "${REPO_ROOT}/docker-compose.yml"
  -f "${REPO_ROOT}/docker-compose.ci.yml"
  -f "${REPO_ROOT}/docker-compose.smoke.yml"
)

echo "=== worker HTTP extract throughput (compose worker, default env) ==="
"${COMPOSE[@]}" exec -T worker \
  python tests/scripts/worker_http_throughput_benchmark.py \
  --base-url "http://127.0.0.1:8000" \
  --rounds "${WORKER_HTTP_BENCH_ROUNDS:-2}" \
  --concurrency "${WORKER_HTTP_BENCH_CONCURRENCY:-2}"
