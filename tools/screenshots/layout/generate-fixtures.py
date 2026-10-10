#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Write deterministic layout screenshot PDF fixtures into tools/screenshots/layout/fixtures/."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKER_TESTS = REPO_ROOT / "apps" / "worker"
sys.path.insert(0, str(WORKER_TESTS))

from tests.synthetic_layout_fpdf import academic_layout_regression_paper_pdf  # noqa: E402

OUT = Path(__file__).resolve().parent / "fixtures" / "synthetic-paper.pdf"


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(academic_layout_regression_paper_pdf())
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
