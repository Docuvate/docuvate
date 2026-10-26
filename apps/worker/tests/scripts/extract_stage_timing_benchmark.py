#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Per-stage wall time and peak RSS for one public-domain scan extract."""

from __future__ import annotations

import json
import os
import resource
import sys
import time
from pathlib import Path

_WORKER_ROOT = Path(__file__).resolve().parents[2]
if str(_WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(_WORKER_ROOT))

from docuvate_worker.application.extract import extract_document
from docuvate_worker.infrastructure.extract_memory.profiling import last_memory_profile_report
from tests.public_domain_dense_scans import public_domain_dense_scan_pdf


def _peak_rss_mib() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    if sys.platform == "darwin":
        return usage.ru_maxrss / (1024 * 1024)
    return usage.ru_maxrss / 1024


def main() -> int:
    os.environ.setdefault("DOCUVATE_OCR_BACKEND", "rapidocr")
    os.environ.setdefault("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    os.environ.setdefault("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    os.environ.setdefault("DOCUVATE_EXTRACT_ADMISSION", "0")
    os.environ.setdefault("DOCUVATE_EXTRACT_KEEP_MODELS", "1")
    os.environ["DOCUVATE_EXTRACT_MEMORY_PROFILE"] = "1"

    pdf = public_domain_dense_scan_pdf(20, dpi=300)
    baseline = _peak_rss_mib()
    started = time.perf_counter()
    result = extract_document(pdf, "application/pdf", engine="pipeline")
    elapsed = time.perf_counter() - started
    peak = _peak_rss_mib()
    report = last_memory_profile_report()
    stage_peaks = report.to_dict() if report is not None else {}
    print(
        json.dumps(
            {
                "pages": 20,
                "dpi": 300,
                "wall_seconds": round(elapsed, 3),
                "text_chars": len(result.text),
                "peak_rss_mib": round(peak, 1),
                "delta_rss_mib": round(peak - baseline, 1),
                "stage_peak_rss_mib": stage_peaks,
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
