from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.extractors.markdown import (
    blocks_to_markdown,
    extraction_to_markdown,
    markdown_to_plain,
    plain_text_to_markdown,
)


def test_blocks_to_markdown_groups_lines_and_headings() -> None:
    blocks = [
        ExtractionBlock(page=1, x=0.1, y=0.1, width=0.3, height=0.02, text="INVOICE", block_index=0),
        ExtractionBlock(page=1, x=0.1, y=0.2, width=0.2, height=0.02, text="Acme", block_index=1),
        ExtractionBlock(page=1, x=0.35, y=0.2, width=0.2, height=0.02, text="GmbH", block_index=2),
        ExtractionBlock(page=1, x=0.1, y=0.3, width=0.4, height=0.02, text="- Item one", block_index=3),
    ]
    md = blocks_to_markdown(blocks)
    assert "## INVOICE" in md
    assert "Acme GmbH" in md
    assert "- Item one" in md


def test_extraction_to_markdown_from_plain_text() -> None:
    text = "TITLE LINE\n\nBody paragraph."
    md = extraction_to_markdown(text, None)
    assert md is not None
    assert "TITLE LINE" in md
    assert "Body paragraph." in md


def test_markdown_to_plain_strips_headings() -> None:
    plain = markdown_to_plain("## Hello\n\n**Bold** item")
    assert "Hello" in plain
    assert "Bold" in plain
    assert "##" not in plain
    assert "**" not in plain


def test_plain_text_to_markdown_preserves_bullets() -> None:
    md = plain_text_to_markdown("Notes\n- first\n- second")
    assert "- first" in md
    assert "- second" in md
