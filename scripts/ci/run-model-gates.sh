#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

pip install 'uv==0.12.23'
export PATH="${HOME}/.local/bin:${PATH}"
typst_line="$(bash scripts/ci/install-typst.sh | tail -1)"
if [[ "$typst_line" == typst_bin_dir=* ]]; then
  export PATH="${typst_line#typst_bin_dir=}:${PATH}"
fi
sudo apt-get update -qq
sudo apt-get install -y -qq poppler-utils fonts-dejavu-core fonts-noto-cjk

cd apps/worker
if [[ ! -d .venv ]]; then
  uv venv .venv
fi
uv pip install -e ".[dev]"
PY="$ROOT/apps/worker/.venv/bin/python"
# pyright/mypy already in worker dev extras

"$PY" -m pyright -p "$ROOT/bench/pyrightconfig.json"
cd "$ROOT/bench"
"$PY" -m mypy --config-file mypy.ini

cd "$ROOT"
bash scripts/ci/check-model-gates-baseline.sh
"$PY" bench/run_model_gates.py --check
