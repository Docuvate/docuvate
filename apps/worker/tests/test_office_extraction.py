# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from collections.abc import Callable

import pytest

from docuvate_worker.infrastructure.extractors.pipeline import PipelineExtractor
from tests.synthetic_office_fixtures import (
    synthetic_csv_bytes,
    synthetic_docx_bytes,
    synthetic_md_bytes,
    synthetic_pptx_bytes,
    synthetic_xlsx_bytes,
)


@pytest.mark.parametrize(
    ("factory", "mime_type", "needle"),
    [
        (synthetic_docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "199,00"),
        (synthetic_xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Widget"),
        (synthetic_csv_bytes, "text/csv", "Widget"),
        (synthetic_pptx_bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation", "Synthetic Slide"),
        (synthetic_md_bytes, "text/markdown", "Markdown"),
    ],
)
def test_office_pipeline_extracts_text(
    factory: Callable[[], bytes],
    mime_type: str,
    needle: str,
) -> None:
    content = factory()
    result = PipelineExtractor().extract(content, mime_type)
    assert needle in result.text
    assert result.blocks
    assert result.cpu_pipeline is not None
