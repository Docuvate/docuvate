#!/usr/bin/env bash
# Manual / optional CI: kind cluster smoke (build images, migrate, health checks).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec bash "$ROOT/deploy/scripts/kind-smoke.sh"
