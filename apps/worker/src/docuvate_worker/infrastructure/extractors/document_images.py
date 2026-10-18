# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Extract embedded images and non-text figure regions (CPU, local, no regex)."""

from __future__ import annotations

import io
import logging
from typing import Literal

import numpy as np
from PIL import Image

from docuvate_worker.domain.models import ExtractedDocumentImage, ExtractionBlock

logger = logging.getLogger(__name__)

ImageKind = Literal["embedded", "figure"]

_MIN_PAGE_FRACTION = 0.012
_MAX_IMAGES_PER_DOCUMENT = 48
_THUMBNAIL_MAX = (240, 160)


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _normalize_box(
    x0: float, top: float, x1: float, bottom: float, page_width: float, page_height: float
) -> tuple[float, float, float, float] | None:
    if page_width <= 0 or page_height <= 0:
        return None
    x = _clamp01(x0 / page_width)
    y = _clamp01(top / page_height)
    w = _clamp01((x1 - x0) / page_width)
    h = _clamp01((bottom - top) / page_height)
    if w <= 0 or h <= 0:
        return None
    if w * h < _MIN_PAGE_FRACTION:
        return None
    return x, y, w, h


def _thumbnail_from_bytes(raw: bytes) -> bytes | None:
    try:
        with Image.open(io.BytesIO(raw)) as img:
            rgb = img.convert("RGB")
            rgb.thumbnail(_THUMBNAIL_MAX, Image.Resampling.LANCZOS)
            out = io.BytesIO()
            rgb.save(out, format="PNG", optimize=True)
            return out.getvalue()
    except Exception:
        return None


def _caption_below_box(
    page: int, box: tuple[float, float, float, float], blocks: list[ExtractionBlock]
) -> str | None:
    _, y, w, h = box
    bottom = y + h
    candidates: list[tuple[float, str]] = []
    for block in blocks:
        if block.page != page:
            continue
        if block.y < bottom or block.y > bottom + 0.08:
            continue
        overlap = min(block.x + block.width, box[0] + w) - max(block.x, box[0])
        if overlap <= 0:
            continue
        text = block.text.strip()
        if len(text) < 2:
            continue
        candidates.append((block.y, text))
    if not candidates:
        return None
    candidates.sort(key=lambda row: row[0])
    return candidates[0][1][:240]


def _extract_embedded_pdf_images(
    content: bytes, blocks: list[ExtractionBlock] | None
) -> list[ExtractedDocumentImage]:
    import pdfplumber  # noqa: PLC0415

    out: list[ExtractedDocumentImage] = []
    block_list = blocks or []
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_num = int(page.page_number)
                page_w = float(page.width or 0)
                page_h = float(page.height or 0)
                for img in page.images or []:
                    try:
                        x0 = float(img["x0"])
                        x1 = float(img["x1"])
                        top = float(img["top"])
                        bottom = float(img["bottom"])
                    except (KeyError, TypeError, ValueError):
                        continue
                    norm = _normalize_box(x0, top, x1, bottom, page_w, page_h)
                    if norm is None:
                        continue
                    stream = img.get("stream")
                    raw: bytes | None = None
                    if stream is not None:
                        try:
                            raw = stream.get_data()
                        except Exception:
                            raw = None
                    if not raw:
                        continue
                    thumb = _thumbnail_from_bytes(raw)
                    if not thumb:
                        continue
                    caption = _caption_below_box(page_num, norm, block_list)
                    out.append(
                        ExtractedDocumentImage(
                            page=page_num,
                            x=norm[0],
                            y=norm[1],
                            width=norm[2],
                            height=norm[3],
                            kind="embedded",
                            caption=caption,
                            thumbnail_png=thumb,
                        )
                    )
                    if len(out) >= _MAX_IMAGES_PER_DOCUMENT:
                        return out
    except Exception as exc:
        logger.warning("embedded_pdf_image_extract_failed type=%s", type(exc).__name__)
    return out


def _figure_regions_from_page_render(
    content: bytes,
    page_num: int,
    page_blocks: list[ExtractionBlock],
    existing: list[tuple[float, float, float, float]],
) -> list[ExtractedDocumentImage]:
    from pdf2image import convert_from_bytes  # noqa: PLC0415

    try:
        images = convert_from_bytes(
            content, first_page=page_num, last_page=page_num, dpi=72, fmt="png"
        )
    except Exception:
        return []
    if not images:
        return []
    rgb = np.asarray(images[0].convert("L"))
    h_px, w_px = rgb.shape
    if h_px < 8 or w_px < 8:
        return []
    mask = np.ones((h_px, w_px), dtype=np.uint8)
    for block in page_blocks:
        x0 = int(block.x * w_px)
        y0 = int(block.y * h_px)
        x1 = int(min(w_px, (block.x + block.width) * w_px))
        y1 = int(min(h_px, (block.y + block.height) * h_px))
        pad = 2
        mask[
            max(0, y0 - pad) : min(h_px, y1 + pad),
            max(0, x0 - pad) : min(w_px, x1 + pad),
        ] = 0
    ink = (rgb < 245) & (mask > 0)
    if not ink.any():
        return []
    try:
        from scipy import ndimage  # noqa: PLC0415
    except ImportError:
        return []
    labeled, count = ndimage.label(ink)
    if count <= 0:
        return []
    out: list[ExtractedDocumentImage] = []
    min_pixels = int(w_px * h_px * _MIN_PAGE_FRACTION)
    for label_id in range(1, count + 1):
        ys, xs = np.where(labeled == label_id)
        if ys.size < min_pixels:
            continue
        x0, x1 = int(xs.min()), int(xs.max()) + 1
        y0, y1 = int(ys.min()), int(ys.max()) + 1
        nx = _clamp01(x0 / w_px)
        ny = _clamp01(y0 / h_px)
        nw = _clamp01((x1 - x0) / w_px)
        nh = _clamp01((y1 - y0) / h_px)
        if nw * nh < _MIN_PAGE_FRACTION:
            continue
        overlaps = False
        for ex in existing:
            ix = max(nx, ex[0])
            iy = max(ny, ex[1])
            ax = min(nx + nw, ex[0] + ex[2])
            ay = min(ny + nh, ex[1] + ex[3])
            if ax > ix and ay > iy:
                inter = (ax - ix) * (ay - iy)
                if inter / (nw * nh) > 0.5:
                    overlaps = True
                    break
        if overlaps:
            continue
        crop = images[0].crop((x0, y0, x1, y1))
        buf = io.BytesIO()
        crop.save(buf, format="PNG")
        thumb = _thumbnail_from_bytes(buf.getvalue())
        if not thumb:
            continue
        box = (nx, ny, nw, nh)
        caption = _caption_below_box(page_num, box, page_blocks)
        out.append(
            ExtractedDocumentImage(
                page=page_num,
                x=nx,
                y=ny,
                width=nw,
                height=nh,
                kind="figure",
                caption=caption,
                thumbnail_png=thumb,
            )
        )
    return out


def _extract_figure_regions_pdf(
    content: bytes, blocks: list[ExtractionBlock] | None
) -> list[ExtractedDocumentImage]:
    if not blocks:
        return []
    by_page: dict[int, list[ExtractionBlock]] = {}
    for block in blocks:
        by_page.setdefault(block.page, []).append(block)
    embedded_boxes: list[tuple[float, float, float, float]] = []
    for img in _extract_embedded_pdf_images(content, blocks):
        embedded_boxes.append((img.x, img.y, img.width, img.height))
    out: list[ExtractedDocumentImage] = []
    for page_num in sorted(by_page):
        if len(out) >= _MAX_IMAGES_PER_DOCUMENT:
            break
        found = _figure_regions_from_page_render(content, page_num, by_page[page_num], embedded_boxes)
        for img in found:
            embedded_boxes.append((img.x, img.y, img.width, img.height))
            out.append(img)
            if len(out) >= _MAX_IMAGES_PER_DOCUMENT:
                break
    return out


def _extract_raster_document_image(content: bytes, mime_type: str) -> list[ExtractedDocumentImage]:
    if not mime_type.startswith("image/"):
        return []
    thumb = _thumbnail_from_bytes(content)
    if not thumb:
        return []
    return [
        ExtractedDocumentImage(
            page=1,
            x=0.0,
            y=0.0,
            width=1.0,
            height=1.0,
            kind="embedded",
            caption=None,
            thumbnail_png=thumb,
        )
    ]


def extract_document_images(
    content: bytes,
    mime_type: str,
    blocks: list[ExtractionBlock] | None,
) -> list[ExtractedDocumentImage]:
    if mime_type == "application/pdf":
        embedded = _extract_embedded_pdf_images(content, blocks)
        if len(embedded) >= _MAX_IMAGES_PER_DOCUMENT:
            return embedded[:_MAX_IMAGES_PER_DOCUMENT]
        figures = _extract_figure_regions_pdf(content, blocks)
        merged = embedded + [f for f in figures if f.kind == "figure"]
        return merged[:_MAX_IMAGES_PER_DOCUMENT]
    return _extract_raster_document_image(content, mime_type)
