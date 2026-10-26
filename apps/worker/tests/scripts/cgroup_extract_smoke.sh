#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if ! command -v docker >/dev/null 2>&1; then
  echo "SKIP cgroup_extract_smoke: docker not available"
  exit 0
fi
VENV="${DOCUVATE_WORKER_VENV:-.venv}"
if [[ ! -x "$VENV/bin/python" ]]; then
  uv venv "$VENV" --allow-existing
  uv pip install --python "$VENV/bin/python" -e ".[dev]" >/dev/null
fi
docker run --rm --memory=2g --memory-swap=2g \
  -e DOCUVATE_ALLOW_IN_PROCESS_EXTRACT=1 \
  -e DOCUVATE_EXTRACT_SUBPROCESS=0 \
  -e DOCUVATE_EXTRACT_ADMISSION=1 \
  -e DOCUVATE_OCR_BACKEND=rapidocr \
  -v "$ROOT:/work" -w /work \
  python:3.12-bookworm \
  "$VENV/bin/python" - <<'PY'
import resource
from docuvate_worker.application.extract import extract_document
from docuvate_worker.infrastructure.extract_memory.admission import extract_admission_slot
from tests.public_domain_dense_scans import public_domain_dense_scan_pdf

def peak_mib() -> float:
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024

for pages, dpi in ((20, 300), (35, 280), (50, 260)):
    pdf = public_domain_dense_scan_pdf(pages, dpi=dpi)
    with extract_admission_slot(pdf, "application/pdf"):
        extract_document(pdf, "application/pdf", engine="pipeline")
    print(f"OK cgroup_extract pages={pages} dpi={dpi} peak_mib={peak_mib():.1f}")
PY
