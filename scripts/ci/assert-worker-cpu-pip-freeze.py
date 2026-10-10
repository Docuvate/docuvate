#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Fail when the CPU worker image contains CUDA/Triton/NVIDIA pip packages."""

from __future__ import annotations

import re
import subprocess
import sys

_FORBIDDEN = re.compile(r"(?i)^(nvidia|triton|cuda[-_])")


def _freeze_lines() -> list[str]:
    proc = subprocess.run(
        [sys.executable, "-m", "pip", "freeze"],
        check=True,
        capture_output=True,
        text=True,
    )
    return [line.strip() for line in proc.stdout.splitlines() if line.strip()]


def main() -> int:
    offenders = [
        line
        for line in _freeze_lines()
        if _FORBIDDEN.search(line.split("==", 1)[0].split("@", 1)[0])
    ]
    if offenders:
        print("CPU worker pip freeze must not include CUDA/Triton/NVIDIA packages:", file=sys.stderr)
        for line in sorted(offenders):
            print(f"  {line}", file=sys.stderr)
        return 1
    print("CPU worker pip freeze OK (no CUDA/Triton/NVIDIA packages).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
