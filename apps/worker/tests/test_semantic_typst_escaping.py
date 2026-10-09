"""Unit tests for semantic Typst text escaping."""

from docuvate_worker.infrastructure.layout.render_typst_semantic import (
    _escape_semantic_text,
)


def test_escape_ordered_list_marker() -> None:
    assert _escape_semantic_text("1. Quartal").startswith("\\")


def test_escape_bullet_marker() -> None:
    assert _escape_semantic_text("- 5 %").startswith("\\-")


def test_escape_slash_comment() -> None:
    out = _escape_semantic_text("a/b // c")
    assert "\\/\\/" in out or "//" not in out or "\\" in out


def test_escape_tilde() -> None:
    assert "\\~" in _escape_semantic_text("Preis ~ 10")
