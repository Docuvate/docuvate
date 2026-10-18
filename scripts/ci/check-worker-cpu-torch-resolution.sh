#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
# Assert CPU torch resolution has no CUDA/Triton/NVIDIA wheels for all worker extras.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORKER_DIR="${ROOT}/apps/worker"
OUT_DIR="${ROOT}/.cache/worker-cpu-compile"
FORBIDDEN_RE='^(nvidia|triton|cuda[-_])'

mkdir -p "$OUT_DIR"
cd "$WORKER_DIR"

platforms=(aarch64-unknown-linux-gnu x86_64-unknown-linux-gnu)
extras_list=("" "docling" "donut")

fail=0
for platform in "${platforms[@]}"; do
  for extra in "${extras_list[@]}"; do
    label="${platform}-${extra:-base}"
    out="${OUT_DIR}/${label}.txt"
    args=(pip compile pyproject.toml --python-version 3.12 --python-platform "$platform" --torch-backend cpu)
    if [ -n "$extra" ]; then
      args+=(--extra "$extra")
    fi
    uv "${args[@]}" -o "$out" >/dev/null
    if rg -i "$FORBIDDEN_RE" "$out" >/dev/null; then
      echo "CPU torch resolution failed for ${label}:" >&2
      rg -i "$FORBIDDEN_RE" "$out" >&2 || true
      fail=1
    else
      echo "OK ${label} (torch-backend cpu, no CUDA packages)"
    fi
  done
done

if [ "$fail" -ne 0 ]; then
  exit 1
fi
