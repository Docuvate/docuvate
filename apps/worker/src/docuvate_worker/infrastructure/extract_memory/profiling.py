# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""tracemalloc + RSS sampling per extraction stage."""

from __future__ import annotations

import json
import os
import tracemalloc
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass, field
from enum import StrEnum

import psutil


class ExtractMemoryStage(StrEnum):
    PDF_OPEN = "pdf_open"
    RASTERIZE = "rasterize"
    OCR = "ocr"
    LAYOUT = "layout"
    EMBEDDING = "embedding"
    FIELD_EXTRACTION = "field_extraction"
    OTHER = "other"


def _rss_bytes() -> int:
    return int(psutil.Process(os.getpid()).memory_info().rss)


@dataclass
class StagePeak:
    stage: ExtractMemoryStage
    peak_rss_mib: float
    peak_traced_mib: float


@dataclass
class MemoryProfileReport:
    stages: list[StagePeak] = field(default_factory=list)

    def peak_rss_mib(self, stage: ExtractMemoryStage) -> float | None:
        for row in self.stages:
            if row.stage == stage:
                return row.peak_rss_mib
        return None

    def to_dict(self) -> dict[str, float]:
        return {row.stage.value: row.peak_rss_mib for row in self.stages}


class MemoryProfiler:
    """Record peak RSS and traced heap per stage when DOCUVATE_EXTRACT_MEMORY_PROFILE=1."""

    def __init__(self) -> None:
        self.enabled = os.environ.get("DOCUVATE_EXTRACT_MEMORY_PROFILE", "0") == "1"
        self._report = MemoryProfileReport()
        self._baseline_rss = 0
        self._tracemalloc_started = False

    @property
    def report(self) -> MemoryProfileReport:
        return self._report

    def start(self) -> None:
        if not self.enabled:
            return
        if not tracemalloc.is_tracing():
            tracemalloc.start()
            self._tracemalloc_started = True
        self._baseline_rss = _rss_bytes()

    def stop(self) -> None:
        if self.enabled:
            _registry.last_report = self._report
            path = os.environ.get("DOCUVATE_EXTRACT_MEMORY_PROFILE_PATH")
            if path:
                with open(path, "w", encoding="utf-8") as handle:
                    handle.write(json.dumps(self._report.to_dict()))
        if self._tracemalloc_started and tracemalloc.is_tracing():
            tracemalloc.stop()

    @contextmanager
    def stage(self, stage_id: ExtractMemoryStage) -> Iterator[None]:
        if not self.enabled:
            yield
            return
        peak_rss = _rss_bytes()
        peak_traced = 0
        if tracemalloc.is_tracing():
            peak_traced = tracemalloc.get_traced_memory()[1]
        try:
            yield
        finally:
            rss = _rss_bytes()
            peak_rss = max(peak_rss, rss)
            if tracemalloc.is_tracing():
                traced = tracemalloc.get_traced_memory()[1]
                peak_traced = max(peak_traced, traced)
            self._report.stages.append(
                StagePeak(
                    stage=stage_id,
                    peak_rss_mib=peak_rss / (1024 * 1024),
                    peak_traced_mib=peak_traced / (1024 * 1024),
                )
            )


@dataclass
class _ProfilerRegistry:
    active: MemoryProfiler | None = None
    last_report: MemoryProfileReport | None = None


_registry = _ProfilerRegistry()


def active_memory_profiler() -> MemoryProfiler | None:
    return _registry.active


def set_active_memory_profiler(profiler: MemoryProfiler | None) -> None:
    _registry.active = profiler


def last_memory_profile_report() -> MemoryProfileReport | None:
    return _registry.last_report
