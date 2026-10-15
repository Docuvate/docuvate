#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PYTHONPATH="${ROOT}/apps/worker/src:${ROOT}/research/closed_form_ml/src"
export DOCUVATE_AI_PROFILE="${DOCUVATE_AI_PROFILE:-off}"
exec python3 -m closed_form_ml.experiments.run_matrix "$@"
