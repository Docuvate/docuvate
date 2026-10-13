#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
pip install 'uv==0.12.23' >/dev/null
VENV="${DOCUVATE_WORKER_VENV:-.venv-ci-lint}"
uv venv "$VENV"
uv pip install --python "$VENV/bin/python" -e ".[dev]" >/dev/null
"$VENV/bin/ruff" check src
"$VENV/bin/pyright"
"$VENV/bin/mypy"
