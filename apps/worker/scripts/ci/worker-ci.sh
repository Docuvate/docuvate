#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
TYPST_BIN_DIR="$(bash ../../scripts/ci/install-typst.sh | awk -F= '/^typst_bin_dir=/{print $2}')"
export PATH="${TYPST_BIN_DIR}:${PATH}"
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq poppler-utils fonts-dejavu-core fonts-noto-cjk >/dev/null || true
fi
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
export DOCUVATE_FUNSD_OCR_CACHE="${DOCUVATE_FUNSD_OCR_CACHE:-$ROOT/tests/.cache/funsd_ocr_eval}"
"$VENV/bin/python" tests/scripts/materialize_funsd_fixtures.py --cache-dir "$DOCUVATE_FUNSD_OCR_CACHE"
"$VENV/bin/pytest" tests -q --ignore=tests/integration --ignore=tests/test_pipeline_extractor_equivalence.py --maxfail=1
bash "$ROOT/../../scripts/ci/check-third-party-models-manifest.sh"
