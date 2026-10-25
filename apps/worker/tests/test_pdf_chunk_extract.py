# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import io

from pypdf import PdfReader, PdfWriter

from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.extractors.pdf_chunk_extract import (
    iter_pdf_page_chunk_specs,
    merge_chunk_ocr_results,
    pdf_page_count,
    persist_chunk_result,
    load_cached_chunk_result,
    shift_blocks_page_offset,
    slice_pdf_bytes,
)


def _three_page_pdf() -> bytes:
    writer = PdfWriter()
    for _ in range(3):
        writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_slice_pdf_preserves_page_count() -> None:
    content = _three_page_pdf()
    sub = slice_pdf_bytes(content, 2, 3)
    assert pdf_page_count(sub) == 2


def test_chunk_specs_cover_all_pages() -> None:
    specs = iter_pdf_page_chunk_specs(25, chunk_pages=12)
    assert specs[0].first_page == 1
    assert specs[-1].last_page == 25
    assert len(specs) == 3


def test_chunk_cache_roundtrip(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_CHUNK_CACHE_DIR", str(tmp_path))
    content = _three_page_pdf()
    spec = iter_pdf_page_chunk_specs(3, chunk_pages=2)[0]
    blocks = [
        ExtractionBlock(
            page=1,
            x=0.1,
            y=0.1,
            width=0.2,
            height=0.02,
            text="hello",
            block_index=0,
        )
    ]
    persist_chunk_result(content, spec, "hello", blocks)
    loaded = load_cached_chunk_result(content, spec)
    assert loaded is not None
    assert loaded[0] == "hello"
    assert loaded[1][0].text == "hello"


def test_merge_and_shift_page_offsets() -> None:
    shifted = shift_blocks_page_offset(
        [
            ExtractionBlock(
                page=1,
                x=0.0,
                y=0.0,
                width=1.0,
                height=1.0,
                text="a",
                block_index=0,
            )
        ],
        page_offset=4,
    )
    assert shifted[0].page == 5
    text, blocks = merge_chunk_ocr_results([("one", shifted), ("two", [])])
    assert "one" in text and "two" in text
    assert blocks[0].page == 5
