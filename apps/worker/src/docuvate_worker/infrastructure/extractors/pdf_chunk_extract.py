# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Split large scan PDFs into page-range sub-documents for bounded OCR memory."""

from __future__ import annotations

import hashlib
import io
import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader, PdfWriter

from docuvate_worker.domain.models import ExtractionBlock

logger = logging.getLogger(__name__)

_ENV_CHUNK_PAGES = "DOCUVATE_EXTRACT_PDF_CHUNK_PAGES"
_DEFAULT_CHUNK_PAGES = 12
_ENV_CHUNK_CACHE = "DOCUVATE_EXTRACT_CHUNK_CACHE_DIR"


def pdf_chunk_page_size() -> int:
    raw = os.environ.get(_ENV_CHUNK_PAGES, str(_DEFAULT_CHUNK_PAGES)).strip()
    try:
        parsed = int(raw)
    except ValueError:
        return _DEFAULT_CHUNK_PAGES
    return max(1, min(parsed, 64))


def pdf_page_count(content: bytes) -> int:
    try:
        reader = PdfReader(io.BytesIO(content))
        return len(reader.pages)
    except Exception:
        return 0


def slice_pdf_bytes(content: bytes, first_page: int, last_page: int) -> bytes:
    reader = PdfReader(io.BytesIO(content))
    writer = PdfWriter()
    total = len(reader.pages)
    start = max(1, first_page)
    end = min(total, last_page)
    for page_index in range(start - 1, end):
        writer.add_page(reader.pages[page_index])
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


@dataclass(frozen=True, slots=True)
class PdfPageChunkSpec:
    chunk_index: int
    first_page: int
    last_page: int
    page_offset: int


def iter_pdf_page_chunk_specs(page_count: int, chunk_pages: int) -> list[PdfPageChunkSpec]:
    specs: list[PdfPageChunkSpec] = []
    chunk_index = 0
    first = 1
    while first <= page_count:
        last = min(page_count, first + chunk_pages - 1)
        specs.append(
            PdfPageChunkSpec(
                chunk_index=chunk_index,
                first_page=first,
                last_page=last,
                page_offset=first - 1,
            )
        )
        chunk_index += 1
        first = last + 1
    return specs


def _content_fingerprint(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _chunk_cache_dir() -> Path:
    base = os.environ.get(_ENV_CHUNK_CACHE, "").strip()
    if base:
        path = Path(base)
    else:
        path = Path(os.environ.get("TMPDIR", "/tmp")) / "docuvate-extract-chunks"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _chunk_cache_path(content: bytes, spec: PdfPageChunkSpec) -> Path:
    digest = _content_fingerprint(content)
    name = f"{digest}-chunk-{spec.chunk_index}-p{spec.first_page}-{spec.last_page}.json"
    return _chunk_cache_dir() / name


def _blocks_from_wire(rows: list[dict[str, object]]) -> list[ExtractionBlock]:
    blocks: list[ExtractionBlock] = []
    for row in rows:
        blocks.append(
            ExtractionBlock(
                page=int(row["page"]),
                x=float(row["x"]),
                y=float(row["y"]),
                width=float(row["width"]),
                height=float(row["height"]),
                text=str(row["text"]),
                block_index=row.get("block_index"),
            )
        )
    return blocks


def _blocks_to_wire(blocks: list[ExtractionBlock]) -> list[dict[str, object]]:
    return [
        {
            "page": block.page,
            "x": block.x,
            "y": block.y,
            "width": block.width,
            "height": block.height,
            "text": block.text,
            "block_index": block.block_index,
        }
        for block in blocks
    ]


def load_cached_chunk_result(
    content: bytes, spec: PdfPageChunkSpec
) -> tuple[str, list[ExtractionBlock]] | None:
    path = _chunk_cache_path(content, spec)
    if not path.is_file():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            return None
        text = str(payload.get("text") or "")
        rows = payload.get("blocks")
        if not isinstance(rows, list):
            return None
        return text, _blocks_from_wire([row for row in rows if isinstance(row, dict)])
    except Exception:
        return None


def persist_chunk_result(
    content: bytes,
    spec: PdfPageChunkSpec,
    text: str,
    blocks: list[ExtractionBlock],
) -> None:
    path = _chunk_cache_path(content, spec)
    payload = {"text": text, "blocks": _blocks_to_wire(blocks)}
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def shift_blocks_page_offset(
    blocks: list[ExtractionBlock], page_offset: int
) -> list[ExtractionBlock]:
    if page_offset == 0:
        return blocks
    shifted: list[ExtractionBlock] = []
    for block in blocks:
        shifted.append(
            ExtractionBlock(
                page=block.page + page_offset,
                x=block.x,
                y=block.y,
                width=block.width,
                height=block.height,
                text=block.text,
                block_index=block.block_index,
            )
        )
    return shifted


def should_chunk_scanned_pdf(content: bytes, mime_type: str, *, requires_ocr: bool) -> bool:
    if mime_type != "application/pdf" or not requires_ocr:
        return False
    pages = pdf_page_count(content)
    return pages > pdf_chunk_page_size()


def merge_chunk_ocr_results(
    parts: list[tuple[str, list[ExtractionBlock]]],
) -> tuple[str, list[ExtractionBlock]]:
    texts: list[str] = []
    blocks: list[ExtractionBlock] = []
    block_index = 0
    for text, chunk_blocks in parts:
        piece = text.strip()
        if piece:
            texts.append(piece)
        for block in chunk_blocks:
            blocks.append(
                ExtractionBlock(
                    page=block.page,
                    x=block.x,
                    y=block.y,
                    width=block.width,
                    height=block.height,
                    text=block.text,
                    block_index=block_index,
                )
            )
            block_index += 1
    return "\n\n".join(texts).strip(), blocks
