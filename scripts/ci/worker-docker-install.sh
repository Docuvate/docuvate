#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

VARIANT="${DOCUVATE_WORKER_TORCH_VARIANT:-cpu}"
OPTIONAL_EXTRAS="${WORKER_OPTIONAL_EXTRAS:-}"
UV_VERSION="${UV_VERSION:-0.12.23}"
TORCH_CPU_INDEX="${TORCH_CPU_INDEX:-https://download.pytorch.org/whl/cpu}"
TORCH_GPU_INDEX="${TORCH_GPU_INDEX:-https://download.pytorch.org/whl/cu124}"

cd /app

pip install --no-cache-dir "uv==${UV_VERSION}"

extras_flag=()
if [ -n "${OPTIONAL_EXTRAS}" ]; then
  extras_flag=(-e "./apps/worker[${OPTIONAL_EXTRAS}]")
else
  extras_flag=(-e ./apps/worker)
fi

uv pip install --system "${extras_flag[@]}"

if [ "${VARIANT}" = "cpu" ]; then
  if python -m pip freeze | grep -qiE '^torch(==|@)'; then
    uv pip install --system --force-reinstall torch torchvision \
      --index-url "${TORCH_CPU_INDEX}"
  fi
  mapfile -t forbidden < <(
    python - <<'PY'
import subprocess
import re
proc = subprocess.run([__import__("sys").executable, "-m", "pip", "freeze"], check=True, capture_output=True, text=True)
pat = re.compile(r"(?i)^(nvidia|triton|cuda[-_])")
for line in proc.stdout.splitlines():
    name = line.split("==", 1)[0].split("@", 1)[0].strip()
    if pat.search(name):
        print(name)
PY
  )
  if ((${#forbidden[@]} > 0)); then
    uv pip uninstall --system "${forbidden[@]}" || true
  fi
  python /app/scripts/ci/assert-worker-cpu-pip-freeze.py
elif [ "${VARIANT}" = "gpu" ]; then
  uv pip install --system --force-reinstall torch torchvision \
    --index-url "${TORCH_GPU_INDEX}"
  if [ "${WORKER_INSTALL_DONUT:-1}" = "1" ]; then
    uv pip install --system -e "./apps/worker[donut]"
  fi
else
  echo "unknown DOCUVATE_WORKER_TORCH_VARIANT=${VARIANT}" >&2
  exit 1
fi

(uv pip uninstall --system opencv-python opencv-contrib-python 2>/dev/null || true)
uv pip install --system --reinstall "opencv-python-headless>=4.8.0,<5.0.0" "numpy>=1.26,<2"

python -c "import cv2; from paddleocr import PaddleOCR; print('opencv', cv2.__version__)"
python -c "from docuvate_worker.infrastructure.extractors.paddle_engine import prewarm_paddle_models; prewarm_paddle_models()"
python -c "from docuvate_worker.infrastructure.fastembed_model import get_embedding_model; get_embedding_model()"
python -c "from docuvate_worker.infrastructure.chat.rag_rerank import rerank_passages; from docuvate_worker.infrastructure.chat.rag_rerank import RagPassage; rerank_passages('ping', [RagPassage(id='1', text='ping response')], top_k=1)"
