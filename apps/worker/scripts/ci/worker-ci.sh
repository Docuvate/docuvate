#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
bash ../../scripts/ci/check-third-party-models-manifest.sh
pip install 'uv==0.12.23' >/dev/null
# Must match [tool.pyright].venv in pyproject.toml (pyright resolves types from this venv).
VENV="${DOCUVATE_WORKER_VENV:-.venv}"
uv venv "$VENV" --allow-existing
uv pip install --python "$VENV/bin/python" -e ".[dev]" >/dev/null
"$VENV/bin/ruff" check src
"$VENV/bin/pyright"
"$VENV/bin/mypy"
"$VENV/bin/python" -m docuvate_worker.infrastructure.ml.third_party_models
"$VENV/bin/pytest" tests -q --ignore=tests/integration --ignore=tests/test_pipeline_extractor_equivalence.py --maxfail=1
bash "$ROOT/../../scripts/ci/check-third-party-models-manifest.sh"
