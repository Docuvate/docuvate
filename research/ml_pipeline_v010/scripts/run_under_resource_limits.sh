#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
# Approximate Docker 2c/4G and 4c/8G without cgroup v2 Docker (uses taskset + ulimit -v).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="${ROOT}/../extraction_baseline/scripts:${ROOT}/lib:${ROOT}/../../apps/worker/src"
export OMP_NUM_THREADS=4 MKL_NUM_THREADS=4 DOCUVATE_ENCODER_INTRA_OP_THREADS=4

OUT="$ROOT/results/resource_limits.json"
mkdir -p "$ROOT/results"

run_profile() {
  local name="$1"
  local cpus="$2"
  local vmem_kb="$3"
  local threads="$4"
  echo "== $name taskset=$cpus ulimit_v=${vmem_kb}KB threads=$threads =="
  python3 - <<PY "$name" "$cpus" "$vmem_kb" "$threads" "$ROOT"
import json
import os
import resource
import subprocess
import sys
import time
from pathlib import Path

name, cpus, vmem_kb, threads, root = sys.argv[1:6]
root = Path(root)
log = root / "results" / f"time_{name}.txt"
cmd = f"""
ulimit -v {vmem_kb} || true
export OMP_NUM_THREADS={threads} DOCUVATE_ENCODER_INTRA_OP_THREADS={threads}
taskset -c {cpus} python3 {root}/scripts/run_unified_field_benchmark.py --max-docs 30
"""
t0 = time.perf_counter()
proc = subprocess.run(["bash", "-c", cmd], capture_output=True, text=True)
wall = time.perf_counter() - t0
ru = resource.getrusage(resource.RUSAGE_CHILDREN)
lines = [
    f"exit_code={proc.returncode}",
    f"wall_seconds={wall:.3f}",
    f"maxrss_kb_children={ru.ru_maxrss}",
    f"stdout_tail={proc.stdout[-2000:]!r}",
    f"stderr_tail={proc.stderr[-2000:]!r}",
]
log.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines[:3]))
PY
}

run_profile "2cpu_4g" "0,1" "$((4 * 1024 * 1024))" 2
run_profile "4cpu_8g" "0,1,2,3" "$((8 * 1024 * 1024))" 4

python3 - <<'PY' "$OUT" "$ROOT"
import json, sys
from pathlib import Path
out, root = Path(sys.argv[1]), Path(sys.argv[2])
payload = {
    "method": "taskset CPU affinity + ulimit -v virtual memory cap (Docker unavailable)",
    "note": "Failures under tight ulimit are informative OOM/kills; not identical to cgroup mem limits.",
    "profiles": {},
}
for name in ("2cpu_4g", "4cpu_8g"):
    p = root / "results" / f"time_{name}.txt"
    payload["profiles"][name] = p.read_text(encoding="utf-8") if p.exists() else ""
out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(out.read_text())
PY
