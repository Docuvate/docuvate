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

echo "Starting SFTP E2E stack (postgres, minio, valkey, api, sftp-ingest)…"
"${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml up -d --build postgres minio minio-init valkey api sftp-ingest

for i in $(seq 1 90); do
  if curl -sf http://localhost:3001/health >/dev/null; then
    break
  fi
  if [ "$i" -eq 90 ]; then
    echo "API health timed out"
    "${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml logs api
    exit 1
  fi
  sleep 2
done

for i in $(seq 1 60); do
  if nc -z 127.0.0.1 "${SFTP_INGEST_PORT:-2222}" 2>/dev/null; then
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "SFTP port not open"
    "${DC[@]}" -f docker-compose.yml -f docker-compose.ci.yml logs sftp-ingest
    exit 1
  fi
  sleep 1
done

pnpm install --filter @docuvate/api...
node scripts/testing/seed-sftp-e2e.mjs

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
