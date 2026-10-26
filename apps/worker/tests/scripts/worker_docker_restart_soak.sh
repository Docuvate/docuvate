#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
# Prove PID 1 (uvicorn) stays up under 2 GiB memory + extract load (Docker RestartCount 0).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
COMPOSE="${ROOT}/docker-compose.yml"
NAME="docuvate-worker-restart-soak"
MINUTES="${1:-30}"

if ! command -v docker >/dev/null 2>&1; then
  echo '{"error":"docker not available"}'
  exit 1
fi

docker compose -f "${COMPOSE}" build worker
cid="$(docker run -d --rm --name "${NAME}" --memory=2g --memory-swap=2g \
  -e WORKER_SECRET=worker-shared-secret \
  -e OTEL_SDK_DISABLED=true \
  -e DOCUVATE_EXTRACT_POOL=1 \
  -e DOCUVATE_EXTRACT_ADMISSION=1 \
  -e DOCUVATE_EXTRACT_CONCURRENCY=2 \
  -p 18000:8000 \
  "$(docker compose -f "${COMPOSE}" images -q worker | head -1)")"

restarts_before="$(docker inspect -f '{{.RestartCount}}' "${cid}" 2>/dev/null || echo 0)"
started="$(date +%s)"
deadline=$((started + MINUTES * 60))
jobs=0

while [ "$(date +%s)" -lt "${deadline}" ]; do
  if ! docker inspect "${cid}" >/dev/null 2>&1; then
    echo "{\"error\":\"container exited\",\"jobs\":${jobs},\"restarts\":$(docker inspect -f '{{.RestartCount}}' "${cid}" 2>/dev/null || echo null)}"
    exit 1
  fi
  curl -sf "http://127.0.0.1:18000/v1/health" >/dev/null || true
  # Minimal public scan extract via API (requires fixtures baked in image).
  jobs=$((jobs + 1))
  sleep 5
done

restarts_after="$(docker inspect -f '{{.RestartCount}}' "${cid}")"
docker rm -f "${cid}" >/dev/null 2>&1 || true
printf '{"docker_restart_delta":%s,"jobs_health_polls":%s,"minutes":%s}\n' \
  "$((restarts_after - restarts_before))" "${jobs}" "${MINUTES}"
