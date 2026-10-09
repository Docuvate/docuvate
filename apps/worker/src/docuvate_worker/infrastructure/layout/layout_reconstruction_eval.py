"""Evaluate exact Typst layout reconstruction fidelity (SSIM) with graceful degradation."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Final

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.pixel_compare import (
    DEFAULT_COMPARE_DPI,
    PagePixelCompareResult,
    compare_pdf_pages,
    compile_typst_to_pdf_bytes,
)
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst

# Minimum SSIM for `reconstruction_reliable` when no per-call override is given.
CATEGORY_SSIM_FLOOR: Final[dict[str, float]] = {
    "born_digital_standard": 0.97,
    "multi_page": 0.96,
    "rotated": 0.95,
    "landscape": 0.96,
    "multi_column": 0.97,
    "table_grid": 0.97,
    "form_acroform": 0.96,
    "mixed_fonts": 0.95,
    "non_latin": 0.94,
    "scanned_text_layer": 0.90,
    "payroll_form": 0.97,
}


class ReconstructionUnreliableReason(StrEnum):
    EXTRACTION_FAILED = "extraction_failed"
    EMPTY_DOCUMENT = "empty_document"
    TYPST_COMPILE_FAILED = "typst_compile_failed"
    RASTERIZE_FAILED = "rasterize_failed"
    BELOW_SSIM_THRESHOLD = "below_ssim_threshold"
    INTERNAL_ERROR = "internal_error"


@dataclass(frozen=True)
class PageReconstructionMetrics:
    page_number: int
    ssim: float | None
    ink_deviation: float | None
    error: str | None


@dataclass(frozen=True)
class LayoutReconstructionEval:
    category: str
    fixture_id: str
    pages: tuple[PageReconstructionMetrics, ...]
    aggregate_ssim: float | None
    reconstruction_reliable: bool
    unreliable_reason: ReconstructionUnreliableReason | None
    detail: str | None


def ssim_floor_for_category(category: str) -> float:
    if category not in CATEGORY_SSIM_FLOOR:
        raise KeyError(f"Unknown layout SSIM category: {category}")
    return CATEGORY_SSIM_FLOOR[category]


def _compare_page_safe(
    original_pdf: bytes,
    reconstruction_pdf: bytes,
    *,
    page_number: int,
    dpi: int,
) -> tuple[PagePixelCompareResult | None, str | None]:
    try:
        return (
            compare_pdf_pages(
                original_pdf,
                reconstruction_pdf,
                page_number=page_number,
                dpi=dpi,
            ),
            None,
        )
    except Exception as exc:  # noqa: BLE001 — return reason to caller, never crash API
        return None, str(exc)


def evaluate_layout_ir_typst_reconstruction(
    original_pdf: bytes,
    doc: LayoutIrDocument,
    *,
    category: str,
    fixture_id: str,
    ssim_floor: float | None = None,
    dpi: int = DEFAULT_COMPARE_DPI,
    typst_source: str | None = None,
) -> LayoutReconstructionEval:
    """Compare original PDF to Typst rendered from layout IR; never raises."""
    floor = ssim_floor if ssim_floor is not None else ssim_floor_for_category(category)
    try:
        source = typst_source if typst_source is not None else layout_ir_to_typst(doc)
        try:
            reconstruction_pdf = compile_typst_to_pdf_bytes(source)
        except Exception as exc:  # noqa: BLE001
            return LayoutReconstructionEval(
                category=category,
                fixture_id=fixture_id,
                pages=(),
                aggregate_ssim=None,
                reconstruction_reliable=False,
                unreliable_reason=ReconstructionUnreliableReason.TYPST_COMPILE_FAILED,
                detail=str(exc),
            )

        page_metrics: list[PageReconstructionMetrics] = []
        ssim_values: list[float] = []
        for page in sorted(doc.pages, key=lambda p: p.page):
            result, err = _compare_page_safe(
                original_pdf,
                reconstruction_pdf,
                page_number=page.page,
                dpi=dpi,
            )
            if result is None:
                page_metrics.append(
                    PageReconstructionMetrics(
                        page_number=page.page,
                        ssim=None,
                        ink_deviation=None,
                        error=err,
                    )
                )
                return LayoutReconstructionEval(
                    category=category,
                    fixture_id=fixture_id,
                    pages=tuple(page_metrics),
                    aggregate_ssim=None,
                    reconstruction_reliable=False,
                    unreliable_reason=ReconstructionUnreliableReason.RASTERIZE_FAILED,
                    detail=err,
                )
            page_metrics.append(
                PageReconstructionMetrics(
                    page_number=page.page,
                    ssim=result.ssim,
                    ink_deviation=result.ink_deviation,
                    error=None,
                )
            )
            ssim_values.append(result.ssim)

        if not ssim_values:
            return LayoutReconstructionEval(
                category=category,
                fixture_id=fixture_id,
                pages=tuple(page_metrics),
                aggregate_ssim=None,
                reconstruction_reliable=False,
                unreliable_reason=ReconstructionUnreliableReason.EMPTY_DOCUMENT,
                detail="No pages in layout IR",
            )

        aggregate = min(ssim_values)
        if aggregate < floor:
            return LayoutReconstructionEval(
                category=category,
                fixture_id=fixture_id,
                pages=tuple(page_metrics),
                aggregate_ssim=aggregate,
                reconstruction_reliable=False,
                unreliable_reason=ReconstructionUnreliableReason.BELOW_SSIM_THRESHOLD,
                detail=f"SSIM {aggregate:.4f} below floor {floor:.4f}",
            )

        return LayoutReconstructionEval(
            category=category,
            fixture_id=fixture_id,
            pages=tuple(page_metrics),
            aggregate_ssim=aggregate,
            reconstruction_reliable=True,
            unreliable_reason=None,
            detail=None,
        )
    except Exception as exc:  # noqa: BLE001
        return LayoutReconstructionEval(
            category=category,
            fixture_id=fixture_id,
            pages=(),
            aggregate_ssim=None,
            reconstruction_reliable=False,
            unreliable_reason=ReconstructionUnreliableReason.INTERNAL_ERROR,
            detail=str(exc),
        )


def evaluate_exact_typst_reconstruction(
    original_pdf: bytes,
    *,
    category: str,
    fixture_id: str,
    ssim_floor: float | None = None,
    dpi: int = DEFAULT_COMPARE_DPI,
    typst_source: str | None = None,
) -> LayoutReconstructionEval:
    """Extract layout IR, render Typst, measure SSIM; never raises."""
    try:
        doc = extract_layout_pdf_bytes(original_pdf)
    except Exception as exc:  # noqa: BLE001
        return LayoutReconstructionEval(
            category=category,
            fixture_id=fixture_id,
            pages=(),
            aggregate_ssim=None,
            reconstruction_reliable=False,
            unreliable_reason=ReconstructionUnreliableReason.EXTRACTION_FAILED,
            detail=str(exc),
        )
    if doc is None or not doc.pages:
        return LayoutReconstructionEval(
            category=category,
            fixture_id=fixture_id,
            pages=(),
            aggregate_ssim=None,
            reconstruction_reliable=False,
            unreliable_reason=ReconstructionUnreliableReason.EXTRACTION_FAILED,
            detail="Layout IR extraction returned no pages",
        )
    return evaluate_layout_ir_typst_reconstruction(
        original_pdf,
        doc,
        category=category,
        fixture_id=fixture_id,
        ssim_floor=ssim_floor,
        dpi=dpi,
        typst_source=typst_source,
    )


def compare_original_pdf_to_typst_safe(
    original_pdf: bytes,
    typst_source: str,
    *,
    page_number: int = 1,
    dpi: int = DEFAULT_COMPARE_DPI,
) -> tuple[PagePixelCompareResult | None, str | None]:
    """Single-page compare; returns (result, error) instead of raising."""
    try:
        reconstruction = compile_typst_to_pdf_bytes(typst_source)
        return (
            compare_pdf_pages(
                original_pdf,
                reconstruction,
                page_number=page_number,
                dpi=dpi,
            ),
            None,
        )
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)
