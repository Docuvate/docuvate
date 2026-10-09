# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from dataclasses import dataclass

from docuvate_worker.domain.ports import ExtractorEngine
from docuvate_worker.infrastructure.extractors.engine_availability import availability_by_id
from docuvate_worker.infrastructure.extractors.pipeline import PipelineExtractor


@dataclass(frozen=True)
class EngineMeta:
    id: str
    label_de: str
    description_de: str
    arena_eligible: bool = True


ENGINE_CATALOG: tuple[EngineMeta, ...] = (
    EngineMeta(
        id="pipeline",
        label_de="Pipeline (Standard)",
        description_de="Born-digital PDF zuerst, sonst PaddleOCR. Empfohlen für CPU-Compose.",
    ),
    EngineMeta(
        id="paddle",
        label_de="PaddleOCR",
        description_de="Immer OCR (Raster). Gut für Scans, langsamer bei langen PDFs.",
    ),
    EngineMeta(
        id="docling",
        label_de="Docling",
        description_de=(
            "Layout-PDF mit Tabellen/Struktur. Optional: Worker-Extra [docling] "
            "(PyTorch + Modell-Download, nicht im Standard-Docker-Image)."
        ),
    ),
    EngineMeta(
        id="pdf_native",
        label_de="PDF-Textlayer",
        description_de="Nur eingebetteter Text, kein OCR. Scans liefern wenig.",
    ),
    EngineMeta(
        id="tesseract",
        label_de="Tesseract",
        description_de="Klassisches OCR (deu+eng). Optional, nicht im Standard-Docker-Image.",
        arena_eligible=False,
    ),
)


def engine_by_name(name: str) -> ExtractorEngine:
    key = name.strip().lower()
    if key in ("pipeline", "default", ""):
        return PipelineExtractor()
    if key in ("paddle", "paddleocr"):
        from docuvate_worker.infrastructure.extractors.paddle_only import PaddleOnlyExtractor

        return PaddleOnlyExtractor()
    if key == "docling":
        from docuvate_worker.infrastructure.extractors.docling_engine import DoclingExtractor

        return DoclingExtractor()
    if key in ("pdf_native", "native", "pdfplumber"):
        from docuvate_worker.infrastructure.extractors.pdf_native_only import PdfNativeOnlyExtractor

        return PdfNativeOnlyExtractor()
    if key == "tesseract":
        from docuvate_worker.infrastructure.extractors.tesseract import TesseractExtractor

        return TesseractExtractor()
    raise ValueError(
        f"Unknown engine {name!r}. Supported: pipeline, paddle, docling, pdf_native, tesseract."
    )


@dataclass(frozen=True)
class ResolvedEngineMeta:
    id: str
    label_de: str
    description_de: str
    available: bool
    arena_eligible: bool


def list_engine_meta() -> list[ResolvedEngineMeta]:
    available = availability_by_id()
    return [
        ResolvedEngineMeta(
            id=m.id,
            label_de=m.label_de,
            description_de=m.description_de,
            available=available.get(m.id, False),
            arena_eligible=m.arena_eligible,
        )
        for m in ENGINE_CATALOG
    ]
