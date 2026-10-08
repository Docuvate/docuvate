#!/usr/bin/env bash
# Local parity with .github/workflows/ci.yml (5 jobs). GitHub Actions may be disabled.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ "${CI_ENABLE_DOCKER_FORWARD:-0}" == "1" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT/scripts/ci/agent-docker-forward.sh"
fi

exec bash "$ROOT/scripts/ci/run-local-ci-jobs.sh"
