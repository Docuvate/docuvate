#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/research/extraction_baseline/scripts"
export OMP_NUM_THREADS=4
export MKL_NUM_THREADS=4
export DOCUVATE_ENCODER_INTRA_OP_THREADS=4
export BENCH_LATENCY_DOCS="${BENCH_LATENCY_DOCS:-30}"

if command -v docker >/dev/null 2>&1; then
  docker run --rm \
    --cpus=4 \
    --memory=8g \
    --memory-swap=8g \
    -v "$ROOT:/workspace" \
    -w /workspace/research/extraction_baseline/scripts \
    -e OMP_NUM_THREADS -e MKL_NUM_THREADS -e DOCUVATE_ENCODER_INTRA_OP_THREADS -e BENCH_LATENCY_DOCS \
    python:3.12-slim \
    bash -lc "pip install -q -r ../requirements.txt && python3 measure_latency.py && python3 run_benchmark.py --max-docs 0"
  exit 0
fi

echo "Docker not available; running on host with ulimit and thread caps" >&2
ulimit -v $((8 * 1024 * 1024)) 2>/dev/null || true
python3 measure_latency.py
python3 run_benchmark.py --max-docs 0
