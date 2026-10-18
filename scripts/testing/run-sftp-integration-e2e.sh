#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ "${DV_AGENT_VM:-0}" == "1" ]] && [[ -f scripts/ci/agent-vm-docker-setup.sh ]]; then
  # shellcheck source=/dev/null
  source scripts/ci/agent-vm-docker-setup.sh
fi

DOCKER="${DOCKER:-docker}"
export DOCKER
DC=($DOCKER compose)

export DATABASE_URL="postgresql://docuvate:docuvate@localhost:5433/docuvate"

export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-docuvate-ci-compose-better-auth-signing-key-2026}"

echo "Starting SFTP E2E stack (postgres, migrate, worker, api, sftp-ingest)…"
for attempt in 1 2 3 4 5; do
  if "${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml up -d --build \
    postgres minio minio-init valkey mailpit migrate db-storage-guard worker \
    sftp-ingest-data-init api sftp-ingest; then
    break
  fi
  if [ "$attempt" -eq 5 ]; then
    echo "compose up failed after ${attempt} attempts"
    exit 1
  fi
  echo "compose up failed (attempt ${attempt}, often Docker Hub rate limit), retrying…"
  sleep $((attempt * 20))
done

MIGRATE_CID="$("${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml ps -aq migrate 2>/dev/null | head -1 || true)"
if [ -n "${MIGRATE_CID}" ]; then
  $DOCKER wait "${MIGRATE_CID}" >/dev/null || true
  MIGRATE_EXIT="$($DOCKER inspect -f '{{.State.ExitCode}}' "${MIGRATE_CID}")"
  if [ "${MIGRATE_EXIT}" != "0" ]; then
    echo "migrate exited with ${MIGRATE_EXIT}"
    "${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml logs migrate
    exit 1
  fi
fi

for i in $(seq 1 90); do
  if curl -sf http://localhost:3001/health/ready >/dev/null; then
    break
  fi
  if [ "$i" -eq 90 ]; then
    echo "API health timed out"
    "${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml logs api
    exit 1
  fi
  sleep 2
done

for i in $(seq 1 90); do
  if nc -z 127.0.0.1 "${SFTP_INGEST_PORT:-2222}" 2>/dev/null; then
    break
  fi
  if [ "$i" -eq 90 ]; then
    echo "SFTP port not open"
    "${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml logs sftp-ingest
    exit 1
  fi
  sleep 1
done

pnpm install --filter @docuvate/api... --ignore-scripts
node --import tsx scripts/testing/seed-sftp-e2e.mjs

SERVICE_KEY="$("${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml exec -T sftp-ingest cat /data/service_api_key | tr -d '\n\r')"
AUTH_BODY="$(mktemp)"
if ! curl -sf -X POST "http://localhost:3001/v1/sftp-ingress/service/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-Docuvate-Api-Key: ${SERVICE_KEY}" \
  -d '{"username":"e2e-scan-upload","password":"E2eSftpUpload9!"}' >"${AUTH_BODY}"; then
  echo "SFTP service authenticate smoke failed"
  "${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml logs api sftp-ingest | tail -80
  exit 1
fi
if ! grep -q '"accountId"' "${AUTH_BODY}"; then
  echo "SFTP service authenticate smoke returned unexpected body:"
  cat "${AUTH_BODY}"
  exit 1
fi
rm -f "${AUTH_BODY}"
sleep 2

export DOCUVATE_SFTP_E2E=1
export DOCUVATE_SFTP_HOST=127.0.0.1
export DOCUVATE_SFTP_PORT="${SFTP_INGEST_PORT:-2222}"

cleanup() {
  cd "$ROOT"
  "${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml down --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

cd apps/sftp-ingest
go test -tags=integration -timeout 10m ./test/integration/...
cd "$ROOT"
"${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml down --remove-orphans
