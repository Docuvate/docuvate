#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PYTHON="${ROOT}/.venv/bin/python"
LIMIT_BYTES=$((2 * 1024 * 1024 * 1024))

run_in_cgroup() {
  local cmd=("$@")
  if command -v systemd-run >/dev/null 2>&1 && [[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]]; then
    if systemd-run --user --wait --quiet -p "MemoryMax=${LIMIT_BYTES}" -p "MemorySwapMax=0" \
      -p "MemoryHigh=${LIMIT_BYTES}" \
      -- "${cmd[@]}"; then
      return
    fi
  fi
  if command -v prlimit >/dev/null 2>&1; then
    prlimit --rss="${LIMIT_BYTES}" --as="${LIMIT_BYTES}" -- "${cmd[@]}"
    return
  fi
  if [[ -w /sys/fs/cgroup/cgroup.procs ]]; then
    local cg="/sys/fs/cgroup/docuvate-bench-$$"
    mkdir -p "${cg}" 2>/dev/null || true
    echo "${LIMIT_BYTES}" > "${cg}/memory.max" 2>/dev/null || true
    echo 0 > "${cg}/memory.swap.max" 2>/dev/null || true
    echo "$$" > "${cg}/cgroup.procs" 2>/dev/null || true
  fi
  "${cmd[@]}"
}

echo "=== stage timing (20p scan) ==="
run_in_cgroup "${PYTHON}" "${ROOT}/tests/scripts/extract_stage_timing_benchmark.py"

for c in 1 2 4; do
  echo "=== throughput concurrency=${c} ==="
  run_in_cgroup "${PYTHON}" "${ROOT}/tests/scripts/extract_throughput_benchmark.py" \
    --concurrency "${c}" --rounds 2 --keep-models 1
done

echo "=== quality concurrency 1 vs 4 ==="
run_in_cgroup "${PYTHON}" "${ROOT}/tests/scripts/extract_quality_concurrency_equivalence.py"
