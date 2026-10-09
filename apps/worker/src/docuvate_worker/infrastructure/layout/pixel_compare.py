"""Rasterize PDF pages and compare original vs Typst reconstruction (SSIM + diff heatmap)."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from pdf2image import convert_from_bytes

DEFAULT_COMPARE_DPI = 100
_INK_DIFF_THRESHOLD = 12


@dataclass(frozen=True)
class PagePixelCompareResult:
    ssim: float
    ink_deviation: float
    heatmap_gray: np.ndarray


def render_pdf_page_gray(
    pdf_bytes: bytes,
    *,
    page_number: int = 1,
    dpi: int = DEFAULT_COMPARE_DPI,
) -> np.ndarray:
    images = convert_from_bytes(
        pdf_bytes,
        dpi=dpi,
        first_page=page_number,
        last_page=page_number,
    )
    if not images:
        raise ValueError(f"PDF has no page {page_number}")
    rgb = np.asarray(images[0].convert("RGB"))
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)


def compile_typst_to_pdf_bytes(typst_source: str, typst_bin: str | None = None) -> bytes:
    binary = typst_bin or shutil.which("typst")
    if not binary:
        raise RuntimeError("typst CLI is required to compile reconstruction PDF")
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        typ_path = root / "page.typ"
        pdf_path = root / "page.pdf"
        typ_path.write_text(typst_source, encoding="utf-8")
        subprocess.run(
            [binary, "compile", str(typ_path), str(pdf_path)],
            check=True,
            capture_output=True,
            text=True,
        )
        return pdf_path.read_bytes()


def _align_sizes(a: np.ndarray, b: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    h = min(a.shape[0], b.shape[0])
    w = min(a.shape[1], b.shape[1])
    return a[:h, :w], b[:h, :w]


def structural_similarity(gray_a: np.ndarray, gray_b: np.ndarray) -> float:
    """SSIM for 8-bit grayscale images (OpenCV quality module)."""
    a, b = _align_sizes(gray_a, gray_b)
    scorer = cv2.quality.QualitySSIM_create(a)
    values = scorer.compute(b)
    return float(max(0.0, min(1.0, values[0])))


def diff_heatmap_gray(gray_a: np.ndarray, gray_b: np.ndarray) -> np.ndarray:
    a, b = _align_sizes(gray_a, gray_b)
    diff = cv2.absdiff(a, b)
    return cv2.GaussianBlur(diff, (0, 0), sigmaX=1.2)


def ink_deviation_ratio(gray_a: np.ndarray, gray_b: np.ndarray) -> float:
    a, b = _align_sizes(gray_a, gray_b)
    mask = np.abs(a.astype(np.int16) - b.astype(np.int16)) > _INK_DIFF_THRESHOLD
    if mask.size == 0:
        return 0.0
    return float(mask.mean())


def compare_pdf_pages(
    original_pdf: bytes,
    reconstruction_pdf: bytes,
    *,
    page_number: int = 1,
    dpi: int = DEFAULT_COMPARE_DPI,
) -> PagePixelCompareResult:
    orig = render_pdf_page_gray(original_pdf, page_number=page_number, dpi=dpi)
    recon = render_pdf_page_gray(reconstruction_pdf, page_number=page_number, dpi=dpi)
    heatmap = diff_heatmap_gray(orig, recon)
    return PagePixelCompareResult(
        ssim=structural_similarity(orig, recon),
        ink_deviation=ink_deviation_ratio(orig, recon),
        heatmap_gray=heatmap,
    )


def compare_original_pdf_to_typst(
    original_pdf: bytes,
    typst_source: str,
    *,
    page_number: int = 1,
    dpi: int = DEFAULT_COMPARE_DPI,
    typst_bin: str | None = None,
) -> PagePixelCompareResult:
    reconstruction = compile_typst_to_pdf_bytes(typst_source, typst_bin=typst_bin)
    return compare_pdf_pages(
        original_pdf,
        reconstruction,
        page_number=page_number,
        dpi=dpi,
    )
