#!/usr/bin/env bash
# Usage: bump-version.sh v0.1.0
set -euo pipefail
VERSION="${1:?Pass semver tag e.g. v0.1.0}"
SUFFIX="${VERSION#v}"
SUFFIX="${SUFFIX//./-}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

sed -i "s/^DOCUVATE_APP_VERSION=.*/DOCUVATE_APP_VERSION=${VERSION}/" "$ROOT/deploy/versions.env"
sed -i "s/^appVersion: .*/appVersion: \"${VERSION}\"/" "$ROOT/deploy/helm/docuvate/Chart.yaml"
sed -i "s/newTag: \".*\"/newTag: \"${VERSION}\"/g" "$ROOT/deploy/kustomize/base/kustomization.yaml"
sed -i "s/name: docuvate-db-migrate-.*/name: docuvate-db-migrate-${SUFFIX}/" "$ROOT/deploy/kustomize/base/jobs/db-migrate.yaml"
sed -i "s/name: docuvate-minio-init-.*/name: docuvate-minio-init-${SUFFIX}/" "$ROOT/deploy/kustomize/components/minio/job-init-bucket.yaml"
sed -i "s/name: docuvate-ollama-init-.*/name: docuvate-ollama-init-${SUFFIX}/" "$ROOT/deploy/kustomize/components/ollama/job-pull-model.yaml"
for patch in homelab dev; do
  f="$ROOT/deploy/kustomize/overlays/${patch}/patch-db-migrate-wait.yaml"
  if [[ -f "$f" ]]; then
    sed -i "s/name: docuvate-db-migrate-.*/name: docuvate-db-migrate-${SUFFIX}/" "$f"
  fi
done
sed -i "s/app.kubernetes.io\/version: .*/app.kubernetes.io\/version: \"${VERSION#v}\"/" "$ROOT/deploy/kustomize/base/api/deployment.yaml"

echo "Bumped to ${VERSION} (job suffix ${SUFFIX})"
