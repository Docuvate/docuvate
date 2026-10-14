#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if [ -x apps/worker/.venv/bin/python ]; then
  PY=apps/worker/.venv/bin/python
else
  PY=python3
  pip install --quiet 'pydantic>=2.9.0,<3'
  export PYTHONPATH="${ROOT}/apps/worker/src${PYTHONPATH:+:${PYTHONPATH}}"
fi
exec "$PY" -m docuvate_worker.infrastructure.ml.third_party_models
