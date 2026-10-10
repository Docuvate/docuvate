#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

VARIANT="${DOCUVATE_WORKER_TORCH_VARIANT:-cpu}"
OPTIONAL_EXTRAS="${WORKER_OPTIONAL_EXTRAS:-}"
UV_VERSION="${UV_VERSION:-0.12.23}"
TORCH_GPU_BACKEND="${TORCH_GPU_BACKEND:-cu124}"

cd /app

pip install --no-cache-dir "uv==${UV_VERSION}"

extras_ref="./apps/worker"
if [ -n "${OPTIONAL_EXTRAS}" ]; then
  extras_ref="./apps/worker[${OPTIONAL_EXTRAS}]"
fi

if [ "${VARIANT}" = "cpu" ]; then
  uv pip install --system --torch-backend cpu -e "${extras_ref}"
  python /app/scripts/ci/assert-worker-cpu-pip-freeze.py
elif [ "${VARIANT}" = "gpu" ]; then
  uv pip install --system --torch-backend "${TORCH_GPU_BACKEND}" -e "${extras_ref}"
  if [ "${WORKER_INSTALL_DONUT:-1}" = "1" ] && [[ "${OPTIONAL_EXTRAS}" != *"donut"* ]]; then
    uv pip install --system --torch-backend "${TORCH_GPU_BACKEND}" -e "./apps/worker[donut]"
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
