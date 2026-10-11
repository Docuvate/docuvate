#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
# Fail when bench/model_gates/baseline.json weakens floors vs merge base.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

CURRENT="$ROOT/bench/model_gates/baseline.json"

BASE_REF="${GITHUB_EVENT_PULL_REQUEST_BASE_SHA:-}"
if [[ -z "$BASE_REF" ]]; then
  BASE_REF="origin/main"
fi

if ! git cat-file -e "${BASE_REF}:bench/model_gates/baseline.json" 2>/dev/null; then
  echo "No parent baseline at ${BASE_REF}; skip baseline guard."
  exit 0
fi

PARENT="$(mktemp)"
git show "${BASE_REF}:bench/model_gates/baseline.json" > "$PARENT"

ALLOW_LOWER_LABEL=0
if [[ -n "${GITHUB_EVENT_PULL_REQUEST_LABELS:-}" ]] && echo "$GITHUB_EVENT_PULL_REQUEST_LABELS" | grep -q 'model-gates-baseline-lower'; then
  ALLOW_LOWER_LABEL=1
fi

CHANGED_PATHS="$(git diff --name-only "${BASE_REF}"...HEAD 2>/dev/null || true)"

cd apps/worker
if [[ ! -d .venv ]]; then
  uv venv .venv
fi
uv pip install -e ".[dev]" >/dev/null
PY="$ROOT/apps/worker/.venv/bin/python"

cd "$ROOT"
export MODEL_GATES_ALLOW_LOWER_LABEL="$ALLOW_LOWER_LABEL"
export MODEL_GATES_CHANGED_PATHS="$CHANGED_PATHS"
"$PY" - "$CURRENT" "$PARENT" <<'PY'
import os
import sys
from pathlib import Path

from bench.model_gates.baseline_guard import (
    baseline_lower_allowed,
    check_baseline_not_weakened,
)

current = Path(sys.argv[1])
parent = Path(sys.argv[2])
allow_label = os.environ.get("MODEL_GATES_ALLOW_LOWER_LABEL", "0") == "1"
raw_paths = os.environ.get("MODEL_GATES_CHANGED_PATHS", "")
changed = frozenset(line.strip() for line in raw_paths.splitlines() if line.strip())
allow_lower = baseline_lower_allowed(allow_lower_label=allow_label, changed_paths=changed)
violations = check_baseline_not_weakened(
    current_path=current,
    parent_path=parent,
    allow_lower=allow_lower,
)
if violations:
    for v in violations:
        print(f"baseline guard: {v.metric} {v.reason} parent={v.parent} current={v.current}")
    raise SystemExit(1)
print("baseline guard OK (no weakened floors vs parent)")
PY
