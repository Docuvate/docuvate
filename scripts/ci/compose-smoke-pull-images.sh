#!/usr/bin/env bash
# Pre-pull external compose images with Hub mirror + retries (smoke profile).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

source "$ROOT/scripts/ci/compose-local-image-names.sh"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.ci.yml -f docker-compose.smoke.yml)

mapfile -t IMAGES < <(
  "${COMPOSE[@]}" --profile smoke config --images \
    | sort -u \
    | grep -v '^docuvate-' \
    | grep -v '^docuvate_' \
    || true
)

if [ "${#IMAGES[@]}" -eq 0 ]; then
  exit 0
fi

bash "$ROOT/scripts/ci/docker-pull-with-retry.sh" "${IMAGES[@]}"
