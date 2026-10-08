#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE="$ROOT/docker-compose.yml"
OUT="$ROOT/deploy/versions.env"

extract_image() {
  local service="$1"
  awk -v svc="$service" '
    $0 ~ "^  " svc ":" { found=1; next }
    found && /^  [a-z]/ { exit }
    found && /^    image:/ { sub(/^    image: /, ""); print; exit }
  ' "$COMPOSE"
}

POSTGRES="$(extract_image postgres)"
VALKEY="$(extract_image valkey)"
MINIO="$(extract_image minio)"
OLLAMA="ollama/ollama:0.12.6@sha256:a61a8fd395dbb931cc8cb1b5da7a2510746575c87113fdc45b647ee59ef7f808"
APP_VERSION="$(grep -m1 'newTag:' "$ROOT/deploy/kustomize/base/kustomization.yaml" | sed 's/.*"\(.*\)".*/\1/')"

cat >"$OUT" <<EOF
# Third-party image pins for Kustomize/Helm. Regenerate with:
#   bash deploy/scripts/sync-versions-from-compose.sh
DOCUVATE_APP_VERSION=${APP_VERSION}
DOCUVATE_POSTGRES_IMAGE=${POSTGRES}
DOCUVATE_VALKEY_IMAGE=${VALKEY}
DOCUVATE_MINIO_IMAGE=${MINIO}
DOCUVATE_MINIO_MC_IMAGE=${MINIO}
DOCUVATE_OLLAMA_IMAGE=${OLLAMA}
EOF
echo "Wrote $OUT"
