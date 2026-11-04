# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.application.cpu_document_pipeline.stages.rotation_stage import (
    run_rotation_stage,
)
from docuvate_worker.domain.cpu_pipeline.contracts import PipelineMutableState
from docuvate_worker.domain.cpu_pipeline.page_rotation import (
    dominant_rotation_deg,
    page_rotations_deg,
)
from docuvate_worker.domain.layout_ir import LayoutIrBlock, LayoutIrDocument, LayoutIrPage
from docuvate_worker.domain.models import ExtractionBlock


def _span(text: str, rotation_deg: float | None, page: int = 1) -> LayoutIrBlock:
    return LayoutIrBlock(
        page=page, x=0.0, y=0.0, width=10.0, height=10.0, text=text, rotation_deg=rotation_deg
    )


def _page(page: int, *blocks: LayoutIrBlock) -> LayoutIrPage:
    return LayoutIrPage(page=page, width_pt=595.0, height_pt=842.0, blocks=blocks)


def test_dominant_rotation_weights_spans_by_text_length() -> None:
    blocks = [_span("Rechnungsnummer", 89.6), _span("Seite", None), _span("1", None)]
    assert dominant_rotation_deg(blocks) == 90.0


def test_dominant_rotation_snaps_to_quarter_turns_in_signed_range() -> None:
    assert dominant_rotation_deg([_span("Kopfzeile", 271.0)]) == -90.0
    assert dominant_rotation_deg([_span("Kopfzeile", -178.0)]) == 180.0


def test_dominant_rotation_prefers_upright_on_ties_and_empty_pages() -> None:
    assert dominant_rotation_deg([_span("abc", 90.0), _span("xyz", None)]) == 0.0
    assert dominant_rotation_deg([_span("   ", 90.0)]) == 0.0
    assert dominant_rotation_deg([]) == 0.0


def test_page_rotations_cover_every_page() -> None:
    pages = (
        _page(1, _span("Anschreiben", None)),
        _page(2, _span("Querformat Tabelle", 90.0, page=2)),
        _page(3),
    )
    assert page_rotations_deg(pages) == (0.0, 90.0, 0.0)


def _pdf_state(layout: LayoutIrDocument | None, mime_type: str) -> PipelineMutableState:
    state = PipelineMutableState(
        content=b"",
        mime_type=mime_type,
        document_id=None,
        text="Querformat",
        blocks=[ExtractionBlock(page=1, x=0.0, y=0.0, width=1.0, height=1.0, text="Querformat")],
    )
    state.prebuilt_layout_ir = layout
    return state


def test_rotation_stage_reports_all_pdf_pages() -> None:
    layout = LayoutIrDocument(
        version=1,
        pages=(
            _page(1, _span("Deckblatt", None)),
            _page(2, _span("Querformat Tabelle", -90.0, page=2)),
        ),
    )
    data = run_rotation_stage(_pdf_state(layout, "application/pdf")).data
    assert data.page_rotations_deg == (0.0, -90.0)
    assert data.correction_applied is True


def test_rotation_stage_upright_pdf_needs_no_correction() -> None:
    layout = LayoutIrDocument(version=1, pages=(_page(1, _span("Brief", None)),))
    data = run_rotation_stage(_pdf_state(layout, "application/pdf")).data
    assert data.page_rotations_deg == (0.0,)
    assert data.correction_applied is False


def test_rotation_stage_does_not_fabricate_measurements_for_images() -> None:
    data = run_rotation_stage(_pdf_state(None, "image/png")).data
    assert data.page_rotations_deg == ()
    assert data.correction_applied is False
