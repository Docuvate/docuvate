from pathlib import Path

from docuvate_worker.domain.layout_ir import LayoutIrDocument, LayoutIrPage
from docuvate_worker.infrastructure.layout.layout_ssim_category import infer_layout_ssim_category

_BORN_DIGITAL_PDF = (
    Path(__file__).resolve().parents[3]
    / "tools/screenshots/layout/fixtures/layout-ws-brutto.pdf"
).read_bytes()


def _page(page: int, width: float, height: float) -> LayoutIrPage:
    return LayoutIrPage(
        page=page,
        width_pt=width,
        height_pt=height,
        blocks=(),
        lines=(),
        tables=(),
        vectors=(),
        widgets=(),
    )


def test_infer_multi_page_category() -> None:
    doc = LayoutIrDocument(
        version=1,
        pages=(
            _page(1, 595, 842),
            _page(2, 595, 842),
        ),
    )
    assert infer_layout_ssim_category(doc, _BORN_DIGITAL_PDF) == "multi_page"


def test_infer_landscape_category() -> None:
    doc = LayoutIrDocument(version=1, pages=(_page(1, 842, 595),))
    assert infer_layout_ssim_category(doc, _BORN_DIGITAL_PDF) == "landscape"
