#!/usr/bin/env bash
# CI entrypoint: kustomize build + helm lint/template + kubeconform + parity report.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec bash "$ROOT/deploy/scripts/render-and-parity-report.sh"
