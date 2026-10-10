# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.domain.ports import ExtractorEngine


class DonutStubExtractor(ExtractorEngine):
    """Placeholder for Donut receipt model — registry hook for phase 2."""

    name = "donut-stub"

    def supports(self, mime_type: str) -> bool:
        return False

    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        raise NotImplementedError("Donut engine not enabled in MVP")
