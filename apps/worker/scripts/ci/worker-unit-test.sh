#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
pip install 'uv==0.12.23' >/dev/null
uv venv .venv
uv pip install -e ".[dev]" >/dev/null
.venv/bin/pytest tests -q --ignore=tests/integration --ignore=tests/test_pipeline_extractor_equivalence.py --maxfail=1
