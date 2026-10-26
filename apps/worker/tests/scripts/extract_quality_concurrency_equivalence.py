#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Compare extraction text + field payloads at concurrency 1 vs 4 (public scan PDFs)."""

from __future__ import annotations

import hashlib
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_WORKER_ROOT = Path(__file__).resolve().parents[2]
if str(_WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(_WORKER_ROOT))

from docuvate_worker.application.extract import extract_document
from tests.public_domain_dense_scans import public_domain_dense_scan_pdf

_CASES: tuple[tuple[str, int, int], ...] = (
    ("scan_8p_300dpi", 8, 300),
    ("scan_12p_280dpi", 12, 280),
)


def _payload_digest(text: str, fields: list) -> str:
    field_rows = sorted(
        (getattr(f, "key", ""), getattr(f, "value", "")) for f in (fields or [])
    )
    payload = text + "\n" + repr(field_rows)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _run_case(pdf: bytes) -> dict[str, str]:
    result = extract_document(pdf, "application/pdf", engine="pipeline")
    return {
        "text_digest": hashlib.sha256(result.text.encode("utf-8")).hexdigest(),
        "fields_digest": _payload_digest(result.text, list(result.fields or [])),
        "label_digest": _payload_digest(
            result.text,
            [f for f in (result.fields or []) if str(getattr(f, "key", "")).startswith("label")],
        ),
    }


def _run_all(pdfs: list[bytes], concurrency: int) -> list[dict[str, str]]:
    os.environ.setdefault("DOCUVATE_OCR_BACKEND", "rapidocr")
    os.environ.setdefault("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    os.environ.setdefault("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    os.environ.setdefault("DOCUVATE_EXTRACT_ADMISSION", "0")
    os.environ.setdefault("DOCUVATE_EXTRACT_KEEP_MODELS", "1")
    out: list[dict[str, str]] = [{} for _ in pdfs]
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = {pool.submit(_run_case, pdf): index for index, pdf in enumerate(pdfs)}
        for future in as_completed(futures):
            out[futures[future]] = future.result()
    return out


def main() -> int:
    pdfs = [public_domain_dense_scan_pdf(pages, dpi=dpi) for _, pages, dpi in _CASES]
    _run_case(pdfs[0])
    at_one = _run_all(pdfs, 1)
    at_four = _run_all(pdfs, 4)
    diffs = []
    for index, name in enumerate([c[0] for c in _CASES]):
        if at_one[index] != at_four[index]:
            diffs.append({"case": name, "concurrency_1": at_one[index], "concurrency_4": at_four[index]})
    print(
        json.dumps(
            {
                "identical": len(diffs) == 0,
                "diff_count": len(diffs),
                "diffs": diffs,
                "cases": len(_CASES),
            },
            sort_keys=True,
        )
    )
    return 0 if not diffs else 1


if __name__ == "__main__":
    raise SystemExit(main())
