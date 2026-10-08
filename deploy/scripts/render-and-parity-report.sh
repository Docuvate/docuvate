#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ART="$ROOT/deploy/artifacts"
mkdir -p "$ART"

for o in homelab cloud dev; do
  kustomize build "$ROOT/deploy/kustomize/overlays/$o" >"$ART/kustomize-$o.yaml"
done

for values in values-homelab.yaml values-cloud.yaml values-dev.yaml; do
  helm lint "$ROOT/deploy/helm/docuvate" -f "$ROOT/deploy/helm/docuvate/$values"
done

helm template docuvate "$ROOT/deploy/helm/docuvate" \
  -f "$ROOT/deploy/helm/docuvate/values-homelab.yaml" \
  -n docuvate >"$ART/helm-homelab.yaml"
helm template docuvate "$ROOT/deploy/helm/docuvate" \
  -f "$ROOT/deploy/helm/docuvate/values-cloud.yaml" \
  -n docuvate >"$ART/helm-cloud.yaml"
helm template docuvate "$ROOT/deploy/helm/docuvate" \
  -f "$ROOT/deploy/helm/docuvate/values-dev.yaml" \
  -n docuvate >"$ART/helm-dev.yaml"

bash "$ROOT/deploy/scripts/check-image-tag-consistency.sh"

KUBE_VERSION="${KUBE_VERSION:-1.30.0}"
for f in "$ART"/kustomize-*.yaml "$ART"/helm-*.yaml; do
  kubeconform -strict -kubernetes-version "$KUBE_VERSION" -summary "$f"
done

python3 "$ROOT/deploy/scripts/parity_report.py"
