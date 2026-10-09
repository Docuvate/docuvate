"""Independent expected reading-order token sequences for semantic Typst export tests.

Defined alongside fixture generators (not derived from the exporter) so order
metrics cannot self-confirm buggy export ordering.
"""

from __future__ import annotations

from docuvate_worker.infrastructure.layout.semantic_typst_metrics import tokenize_words

_BANNER = tokenize_words(
    "Synthetic layout regression document with enough words to classify as born digital."
)

SEMANTIC_READING_ORDER_BY_FIXTURE: dict[str, tuple[str, ...]] = {
    "delivery_note_table": (
        *_BANNER,
        "item",
        "qty",
        "widget",
        "a",
        "2",
        "widget",
        "b",
        "1",
    ),
    "layout_regression_payroll": (
        *_BANNER,
        "synthetic",
        "electronic",
        "payroll",
        "certificate",
        "for",
        "tax",
        "year",
        "2025",
        "fictional",
        "employer",
        "no",
        "personal",
        "data",
        "employee",
        "id",
        "syn",
        "4711",
        "reporting",
        "period",
        "01",
        "01",
        "31",
        "12",
        "gross",
        "wages",
        "incl",
        "benefits",
        "48",
        "250",
        "00",
        "income",
        "tax",
        "withheld",
        "9",
        "120",
        "00",
    ),
    "form_disclosure": (
        *_BANNER,
        "label",
        "value",
        "text",
    ),
    "form_disclosure_acroform": (
        *_BANNER,
        "disclosure",
        "field",
        "value",
        "text",
        "agree",
    ),
    "two_column_words": (
        *_BANNER,
        "lefta",
        "leftb",
        "righta",
        "rightb",
    ),
    "three_column_words": (
        *_BANNER,
        "cola1",
        "cola2",
        "colb1",
        "colb2",
        "colc1",
        "colc2",
    ),
    "delivery_note_multipage": (
        *_BANNER,
        "item",
        "qty",
        "widget",
        "a",
        "2",
        "widget",
        "b",
        "1",
        "page",
        "two",
        "continues",
        "the",
        "synthetic",
        "delivery",
        "note",
        "footer",
        "line",
        "on",
        "two",
    ),
    "mixed_page_sizes": (
        *_BANNER,
        *_BANNER,
    ),
    "multipage_portrait_landscape_table": (
        *_BANNER,
        "item",
        "row",
        "on",
        "page",
        "one",
        "qty",
        *_BANNER,
        "row",
        "on",
        "landscape",
        "page",
        "two",
        "continued",
        "table",
    ),
    "landscape_table": (
        *_BANNER,
        "landscape",
        "row",
        "a",
        "landscape",
        "row",
        "b",
    ),
}


def expected_reading_order_tokens(fixture_id: str) -> list[str] | None:
    raw = SEMANTIC_READING_ORDER_BY_FIXTURE.get(fixture_id)
    if raw is None:
        return None
    return list(raw)


def interleaved_column_major_tokens(fixture_id: str) -> list[str] | None:
    """Deliberately wrong row-major interleaving for multi-column fixtures."""
    if fixture_id == "two_column_words":
        return [
            *_BANNER,
            "lefta",
            "righta",
            "leftb",
            "rightb",
        ]
    if fixture_id == "three_column_words":
        return [
            *_BANNER,
            "cola1",
            "colb1",
            "colc1",
            "cola2",
            "colb2",
            "colc2",
        ]
    return None
