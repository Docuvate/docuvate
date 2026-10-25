# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""tracemalloc top-N allocation sites for extraction profiling."""

from __future__ import annotations

import os
import tracemalloc
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class AllocationSite:
    size_kib: float
    count: int
    traceback: str


def tracemalloc_top_limit() -> int:
    raw = os.environ.get("DOCUVATE_EXTRACT_TRACEMALLOC_TOP", "15").strip()
    if not raw.isdigit():
        return 15
    return max(1, min(int(raw), 50))


def capture_tracemalloc_top(stage: str) -> list[AllocationSite]:
    if not tracemalloc.is_tracing():
        return []
    snapshot = tracemalloc.take_snapshot()
    stats = snapshot.statistics("lineno")[: tracemalloc_top_limit()]
    sites: list[AllocationSite] = []
    for stat in stats:
        trace = ""
        if stat.traceback:
            trace = str(stat.traceback[0])
        sites.append(
            AllocationSite(
                size_kib=stat.size / 1024.0,
                count=stat.count,
                traceback=trace,
            )
        )
    path = os.environ.get("DOCUVATE_EXTRACT_TRACEMALLOC_PATH")
    if path:
        lines = [f"stage={stage}"]
        for site in sites:
            lines.append(f"{site.size_kib:.1f} KiB x{site.count} {site.traceback}")
        with open(path, "a", encoding="utf-8") as handle:
            handle.write("\n".join(lines) + "\n")
    return sites
