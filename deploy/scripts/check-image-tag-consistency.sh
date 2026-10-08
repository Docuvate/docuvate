#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TAG=$(grep -m1 'newTag:' "$ROOT/deploy/kustomize/base/kustomization.yaml" | cut -d'"' -f2)
SUFFIX="${TAG#v}"
SUFFIX="${SUFFIX//./-}"
for kind in db-migrate minio-init; do
  case "$kind" in
    db-migrate) file="$ROOT/deploy/kustomize/base/jobs/db-migrate.yaml" ;;
    minio-init) file="$ROOT/deploy/kustomize/components/minio/job-init-bucket.yaml" ;;
  esac
  job=$(grep "^  name: docuvate-${kind}-" "$file" | awk '{print $2}')
  expected="docuvate-${kind}-${SUFFIX}"
  if [[ "$job" != "$expected" ]]; then
    echo "Job ${kind}: ${job} != ${expected}"
    exit 1
  fi
done
CHART_APP=$(grep '^appVersion:' "$ROOT/deploy/helm/docuvate/Chart.yaml" | awk '{print $2}' | tr -d '"')
if [[ "${CHART_APP}" != "$TAG" ]]; then
  echo "Chart appVersion ${CHART_APP} != kustomize tag ${TAG}"
  exit 1
fi
echo "Image tag ${TAG} matches job suffixes and Chart appVersion."
