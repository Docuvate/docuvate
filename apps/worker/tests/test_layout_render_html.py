from html.parser import HTMLParser

from docuvate_worker.domain.layout_ir import FontWeight, LayoutIrBlock, LayoutIrDocument, LayoutIrPage
from docuvate_worker.infrastructure.layout.render_html import layout_ir_to_html


class _FirstRunStyleParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.style: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "span" or self.style is not None:
            return
        attr_map = {k: v for k, v in attrs}
        if attr_map.get("class") == "run":
            self.style = attr_map.get("style")


def test_layout_html_run_style_attribute_is_quoted_and_parsable() -> None:
    doc = LayoutIrDocument(
        version=1,
        pages=(
            LayoutIrPage(
                page=1,
                width_pt=595.0,
                height_pt=842.0,
                blocks=(
                    LayoutIrBlock(
                        page=1,
                        x=0.1,
                        y=0.1,
                        width=0.4,
                        height=0.02,
                        text="Italic line",
                        font_family="Helvetica-BoldOblique",
                        font_size_pt=12.0,
                        weight=FontWeight.BOLD,
                        rotation_deg=15.0,
                    ),
                ),
            ),
        ),
    )
    html = layout_ir_to_html(doc)
    parser = _FirstRunStyleParser()
    parser.feed(html)
    assert parser.style is not None
    assert "font-family:" in parser.style
    assert "Liberation Sans" in parser.style
    assert "font-style:italic" in parser.style
    assert "transform:rotate" in parser.style
