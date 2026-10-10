# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""On-demand per-page layout reconstruction compare (SSIM + diff heatmap) with caching."""

from __future__ import annotations

import base64
import hashlib
import logging

import cv2
import numpy as np

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.infrastructure.layout.byte_lru_cache import ByteBoundedLruCache
from docuvate_worker.infrastructure.layout.layout_compare_errors import (
    CompareErrorCode,
    LayoutCompareError,
    log_compare_failure,
    map_exception_to_code,
)
from docuvate_worker.infrastructure.layout.layout_compare_limits import (
    CACHE_MAX_BYTES,
    CACHE_MAX_ENTRY_BYTES,
    validate_document_pages,
    validate_metrics_page_batch,
    validate_page_number,
    validate_pdf_bytes,
)
from docuvate_worker.infrastructure.layout.layout_page_compare_types import (
    LayoutCompareSummary,
    LayoutPageComparePayload,
    LayoutPageMetric,
    LayoutPageMetricsBatch,
)
from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import ssim_floor_for_category
from docuvate_worker.infrastructure.layout.layout_ssim_category import infer_layout_ssim_category
from docuvate_worker.infrastructure.layout.pixel_compare import (
    DEFAULT_COMPARE_DPI,
    PagePixelCompareResult,
    compare_pdf_pages,
    compile_typst_to_pdf_bytes,
)
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst

logger = logging.getLogger(__name__)


def _payload_cache_bytes(payload: LayoutPageComparePayload) -> int:
    total = 0
    total += len(payload.original_png_base64)
    total += len(payload.reconstruction_png_base64)
    if payload.heatmap_png_base64:
        total += len(payload.heatmap_png_base64)
    return total


def _pdf_cache_bytes(pdf: bytes) -> int:
    return len(pdf)


_reconstruction_pdf_cache: ByteBoundedLruCache[str, bytes] = ByteBoundedLruCache(
    CACHE_MAX_BYTES, _pdf_cache_bytes
)
_page_compare_cache: ByteBoundedLruCache[str, LayoutPageComparePayload] = ByteBoundedLruCache(
    CACHE_MAX_BYTES, _payload_cache_bytes
)


def _digest_key(*parts: bytes) -> str:
    digest = hashlib.sha256()
    for part in parts:
        digest.update(part)
        digest.update(b"\x1e")
    return digest.hexdigest()


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
    cached = _reconstruction_pdf_cache.get(key)
    if cached is not None:
        return cached
    try:
        reconstruction = compile_typst_to_pdf_bytes(typst)
    except Exception as exc:  # noqa: BLE001
        code = map_exception_to_code(exc)
        log_compare_failure(code, exc)
        raise LayoutCompareError(code, detail=str(exc)) from exc
    _reconstruction_pdf_cache.set(key, reconstruction, max_entry_bytes=CACHE_MAX_ENTRY_BYTES)
    return reconstruction


def layout_compare_summary(original_pdf: bytes, doc: LayoutIrDocument) -> LayoutCompareSummary:
    validate_pdf_bytes(original_pdf)
    validate_document_pages(doc)
    category = infer_layout_ssim_category(doc, original_pdf)
    floor = ssim_floor_for_category(category)
    return LayoutCompareSummary(
        category=category,
        ssim_floor=floor,
        page_count=len(doc.pages),
    )


def _metric_from_compare(
    page_number: int,
    result: PagePixelCompareResult,
    floor: float,
) -> LayoutPageMetric:
    ssim = result.ssim
    reliable = ssim >= floor
    return LayoutPageMetric(
        page_number=page_number,
        ssim=ssim,
        ink_deviation=result.ink_deviation,
        page_reliable=reliable,
        error_code=None,
    )


def collect_layout_compare_metrics_for_pages(
    original_pdf: bytes,
    doc: LayoutIrDocument,
    page_numbers: list[int],
    *,
    dpi: int = DEFAULT_COMPARE_DPI,
) -> LayoutPageMetricsBatch:
    validate_pdf_bytes(original_pdf)
    validate_document_pages(doc)
    pages_to_compute = validate_metrics_page_batch(page_numbers, doc)
    category = infer_layout_ssim_category(doc, original_pdf)
    floor = ssim_floor_for_category(category)
    reconstruction = get_reconstruction_pdf(original_pdf, doc)
    metrics: list[LayoutPageMetric] = []
    for page_number in pages_to_compute:
        try:
            result = compare_pdf_pages(
                original_pdf,
                reconstruction,
                page_number=page_number,
                dpi=dpi,
            )
            metrics.append(_metric_from_compare(page_number, result, floor))
        except Exception as exc:  # noqa: BLE001
            code = map_exception_to_code(exc)
            log_compare_failure(code, exc)
            metrics.append(
                LayoutPageMetric(
                    page_number=page_number,
                    ssim=None,
                    ink_deviation=None,
                    page_reliable=False,
                    error_code=code.value,
                )
            )
    return LayoutPageMetricsBatch(
        category=category,
        ssim_floor=floor,
        page_count=len(doc.pages),
        pages=tuple(metrics),
    )


def _build_success_payload(
    page_number: int,
    result: PagePixelCompareResult,
    floor: float,
    include_heatmap: bool,
) -> LayoutPageComparePayload:
    height_px, width_px = result.original_gray.shape[:2]
    return LayoutPageComparePayload(
        page_number=page_number,
        ssim=result.ssim,
        ink_deviation=result.ink_deviation,
        ssim_floor=floor,
        page_reliable=result.ssim >= floor,
        width_px=width_px,
        height_px=height_px,
        original_png_base64=_png_base64(result.original_gray),
        reconstruction_png_base64=_png_base64(result.reconstruction_gray),
        heatmap_png_base64=(
            _heatmap_png_base64(result.heatmap_gray) if include_heatmap else None
        ),
        error_code=None,
    )


def _build_error_payload(
    page_number: int,
    floor: float,
    code: CompareErrorCode,
) -> LayoutPageComparePayload:
    return LayoutPageComparePayload(
        page_number=page_number,
        ssim=None,
        ink_deviation=None,
        ssim_floor=floor,
        page_reliable=False,
        width_px=0,
        height_px=0,
        original_png_base64="",
        reconstruction_png_base64="",
        heatmap_png_base64=None,
        error_code=code.value,
    )


def compare_layout_page(
    original_pdf: bytes,
    doc: LayoutIrDocument,
    *,
    page_number: int,
    dpi: int = DEFAULT_COMPARE_DPI,
    include_heatmap: bool = True,
) -> LayoutPageComparePayload:
    validate_pdf_bytes(original_pdf)
    validate_document_pages(doc)
    validate_page_number(doc, page_number)
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
    cached = _page_compare_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        reconstruction = get_reconstruction_pdf(original_pdf, doc)
        result = compare_pdf_pages(
            original_pdf,
            reconstruction,
            page_number=page_number,
            dpi=dpi,
        )
        payload = _build_success_payload(page_number, result, floor, include_heatmap)
    except LayoutCompareError as exc:
        if exc.code == CompareErrorCode.PAGE_OUT_OF_RANGE:
            raise
        payload = _build_error_payload(page_number, floor, exc.code)
    except Exception as exc:  # noqa: BLE001
        code = map_exception_to_code(exc)
        log_compare_failure(code, exc)
        payload = _build_error_payload(page_number, floor, code)

    if payload.error_code is None:
        _page_compare_cache.set(cache_key, payload, max_entry_bytes=CACHE_MAX_ENTRY_BYTES)
    return payload


def clear_layout_compare_caches() -> None:
    _reconstruction_pdf_cache.clear()
    _page_compare_cache.clear()
