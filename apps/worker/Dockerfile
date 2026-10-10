# syntax=docker/dockerfile:1
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
#
# Targets:
#   cpu (default) — multi-arch friendly, PyTorch CPU wheels only, no NVIDIA pip packages.
#   gpu           — amd64, CUDA PyTorch wheels (+ donut optional extras).

FROM python:3.12.15-slim AS worker-base
ARG UV_VERSION=0.12.23
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    poppler-utils \
    libgomp1 \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY .tool-versions .tool-versions
COPY scripts/ci/install-typst.sh scripts/ci/install-typst.sh
COPY scripts/ci/worker-docker-install.sh scripts/ci/worker-docker-install.sh
COPY scripts/ci/assert-worker-cpu-pip-freeze.py scripts/ci/assert-worker-cpu-pip-freeze.py
RUN TYPST_BIN_DIR="$(bash scripts/ci/install-typst.sh | sed -n 's/^typst_bin_dir=//p')" \
  && install -m 0755 "${TYPST_BIN_DIR}/typst" /usr/local/bin/typst \
  && typst --version
COPY apps/worker ./apps/worker
ENV FLAGS_use_mkldnn=0
ENV PYTHONPATH=/app/apps/worker/src
ENV HOME=/opt/models
ENV FASTEMBED_CACHE_PATH=/opt/models/fastembed
ENV PADDLE_PDX_CACHE_HOME=/opt/models/paddle
RUN mkdir -p /opt/models/fastembed /opt/models/paddle /opt/models/.paddleocr

FROM worker-base AS cpu
ARG WORKER_OPTIONAL_EXTRAS=
ENV DOCUVATE_WORKER_IMAGE_VARIANT=cpu
ENV DOCUVATE_WORKER_TORCH_VARIANT=cpu
RUN chmod +x scripts/ci/worker-docker-install.sh \
  && WORKER_OPTIONAL_EXTRAS="${WORKER_OPTIONAL_EXTRAS}" DOCUVATE_WORKER_TORCH_VARIANT=cpu \
    bash scripts/ci/worker-docker-install.sh \
  && chown -R 65534:65534 /opt/models
ENV EXTRACTOR_ENGINE=pipeline
ENV PADDLE_OCR_LANG=german
WORKDIR /app/apps/worker
EXPOSE 8000
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["uvicorn", "docuvate_worker.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM worker-base AS gpu
ARG WORKER_OPTIONAL_EXTRAS=donut
ENV DOCUVATE_WORKER_IMAGE_VARIANT=gpu
ENV DOCUVATE_WORKER_TORCH_VARIANT=gpu
ENV WORKER_INSTALL_DONUT=1
RUN chmod +x scripts/ci/worker-docker-install.sh \
  && WORKER_OPTIONAL_EXTRAS="${WORKER_OPTIONAL_EXTRAS}" DOCUVATE_WORKER_TORCH_VARIANT=gpu \
    bash scripts/ci/worker-docker-install.sh \
  && chown -R 65534:65534 /opt/models
ENV EXTRACTOR_ENGINE=pipeline
ENV PADDLE_OCR_LANG=german
WORKDIR /app/apps/worker
EXPOSE 8000
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["uvicorn", "docuvate_worker.main:app", "--host", "0.0.0.0", "--port", "8000"]
