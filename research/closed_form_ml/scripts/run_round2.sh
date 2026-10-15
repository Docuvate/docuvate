#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PYTHONPATH="${ROOT}/apps/worker/src:${ROOT}/research/closed_form_ml/src:${ROOT}/eval"
export DOCUVATE_AI_PROFILE="${DOCUVATE_AI_PROFILE:-on}"
exec python3 -m closed_form_ml.experiments.run_round2 "$@"
