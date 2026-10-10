# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""On-demand per-page layout reconstruction compare (SSIM + diff heatmap) with caching."""

from __future__ import annotations

import base64
import hashlib
import threading
from collections import OrderedDict
from dataclasses import dataclass

import cv2

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import ssim_floor_for_category
from docuvate_worker.infrastructure.layout.layout_ssim_category import infer_layout_ssim_category
from docuvate_worker.infrastructure.layout.pixel_compare import (
    DEFAULT_COMPARE_DPI,
    PagePixelCompareResult,
    compare_pdf_pages,
    compile_typst_to_pdf_bytes,
    render_pdf_page_gray,
)
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst

_MAX_CACHE_ENTRIES = 256
_reconstruction_lock = threading.Lock()
_reconstruction_pdf_cache: OrderedDict[str, bytes] = OrderedDict()
_page_compare_lock = threading.Lock()
_page_compare_cache: OrderedDict[str, LayoutPageComparePayload] = OrderedDict()


@dataclass(frozen=True)
class LayoutPageMetric:
    page_number: int
    ssim: float | None
    ink_deviation: float | None
    page_reliable: bool
    error: str | None


@dataclass(frozen=True)
class LayoutCompareMetrics:
    category: str
    ssim_floor: float
    pages: tuple[LayoutPageMetric, ...]


@dataclass(frozen=True)
class LayoutPageComparePayload:
    page_number: int
    ssim: float
    ink_deviation: float
    ssim_floor: float
    page_reliable: bool
    width_px: int
    height_px: int
    original_png_base64: str
    reconstruction_png_base64: str
    heatmap_png_base64: str | None
    error: str | None


def _digest_key(*parts: bytes) -> str:
    digest = hashlib.sha256()
    for part in parts:
        digest.update(part)
        digest.update(b"\x1e")
    return digest.hexdigest()


def _cache_set(cache: OrderedDict[str, object], key: str, value: object) -> None:
    cache[key] = value
    cache.move_to_end(key)
    while len(cache) > _MAX_CACHE_ENTRIES:
        cache.popitem(last=False)


def _png_base64(gray: np.ndarray) -> str:
    success, encoded = cv2.imencode(".png", gray)
    if not success:
        raise RuntimeError("Failed to encode PNG")
    return base64.b64encode(encoded.tobytes()).decode("ascii")


def _heatmap_png_base64(heatmap_gray: np.ndarray) -> str:
    normalized = cv2.normalize(heatmap_gray, None, 0, 255, cv2.NORM_MINMAX)
    colored = cv2.applyColorMap(normalized.astype(np.uint8), cv2.COLORMAP_INFERNO)
    success, encoded = cv2.imencode(".png", colored)
    if not success:
        raise RuntimeError("Failed to encode heatmap PNG")
    return base64.b64encode(encoded.tobytes()).decode("ascii")


def _reconstruction_cache_key(original_pdf: bytes, typst_source: str) -> str:
    return _digest_key(original_pdf, typst_source.encode("utf-8"))


def get_reconstruction_pdf(original_pdf: bytes, doc: LayoutIrDocument) -> bytes:
    typst = layout_ir_to_typst(doc)
    key = _reconstruction_cache_key(original_pdf, typst)
    with _reconstruction_lock:
        cached = _reconstruction_pdf_cache.get(key)
        if cached is not None:
            _reconstruction_pdf_cache.move_to_end(key)
            return cached
    reconstruction = compile_typst_to_pdf_bytes(typst)
    with _reconstruction_lock:
        _cache_set(_reconstruction_pdf_cache, key, reconstruction)
    return reconstruction


def collect_layout_compare_metrics(
    original_pdf: bytes,
    doc: LayoutIrDocument,
    *,
    dpi: int = DEFAULT_COMPARE_DPI,
) -> LayoutCompareMetrics:
    category = infer_layout_ssim_category(doc, original_pdf)
    floor = ssim_floor_for_category(category)
    reconstruction = get_reconstruction_pdf(original_pdf, doc)
    metrics: list[LayoutPageMetric] = []
    for page in sorted(doc.pages, key=lambda p: p.page):
        page_number = page.page
        try:
            result = compare_pdf_pages(
                original_pdf,
                reconstruction,
                page_number=page_number,
                dpi=dpi,
            )
            reliable = result.ssim >= floor
            metrics.append(
                LayoutPageMetric(
                    page_number=page_number,
                    ssim=result.ssim,
                    ink_deviation=result.ink_deviation,
                    page_reliable=reliable,
                    error=None,
                )
            )
        except Exception as exc:  # noqa: BLE001
            metrics.append(
                LayoutPageMetric(
                    page_number=page_number,
                    ssim=None,
                    ink_deviation=None,
                    page_reliable=False,
                    error=str(exc),
                )
            )
    return LayoutCompareMetrics(category=category, ssim_floor=floor, pages=tuple(metrics))


def compare_layout_page(
    original_pdf: bytes,
    doc: LayoutIrDocument,
    *,
    page_number: int,
    dpi: int = DEFAULT_COMPARE_DPI,
    include_heatmap: bool = True,
) -> LayoutPageComparePayload:
    category = infer_layout_ssim_category(doc, original_pdf)
    floor = ssim_floor_for_category(category)
    typst = layout_ir_to_typst(doc)
    cache_key = _digest_key(
        original_pdf,
        typst.encode("utf-8"),
        str(page_number).encode("utf-8"),
        str(dpi).encode("utf-8"),
        b"1" if include_heatmap else b"0",
    )
    with _page_compare_lock:
        cached = _page_compare_cache.get(cache_key)
        if cached is not None:
            _page_compare_cache.move_to_end(cache_key)
            return cached

    reconstruction = get_reconstruction_pdf(original_pdf, doc)
    try:
        result: PagePixelCompareResult = compare_pdf_pages(
            original_pdf,
            reconstruction,
            page_number=page_number,
            dpi=dpi,
        )
        original_gray = render_pdf_page_gray(
            original_pdf, page_number=page_number, dpi=dpi
        )
        reconstruction_gray = render_pdf_page_gray(
            reconstruction, page_number=page_number, dpi=dpi
        )
        height_px, width_px = original_gray.shape[:2]
        payload = LayoutPageComparePayload(
            page_number=page_number,
            ssim=result.ssim,
            ink_deviation=result.ink_deviation,
            ssim_floor=floor,
            page_reliable=result.ssim >= floor,
            width_px=width_px,
            height_px=height_px,
            original_png_base64=_png_base64(original_gray),
            reconstruction_png_base64=_png_base64(reconstruction_gray),
            heatmap_png_base64=(
                _heatmap_png_base64(result.heatmap_gray) if include_heatmap else None
            ),
            error=None,
        )
    except Exception as exc:  # noqa: BLE001
        payload = LayoutPageComparePayload(
            page_number=page_number,
            ssim=0.0,
            ink_deviation=0.0,
            ssim_floor=floor,
            page_reliable=False,
            width_px=0,
            height_px=0,
            original_png_base64="",
            reconstruction_png_base64="",
            heatmap_png_base64=None,
            error=str(exc),
        )

    with _page_compare_lock:
        _cache_set(_page_compare_cache, cache_key, payload)
    return payload


def clear_layout_compare_caches() -> None:
    with _reconstruction_lock, _page_compare_lock:
        _reconstruction_pdf_cache.clear()
        _page_compare_cache.clear()
