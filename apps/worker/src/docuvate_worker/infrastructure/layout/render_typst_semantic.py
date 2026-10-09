"""Readable, human-editable Typst export from layout IR (semantisch mode)."""

from __future__ import annotations

import re
from dataclasses import dataclass

from docuvate_worker.domain.layout_ir import (
    FontWeight,
    LayoutIrDocument,
    LayoutIrLine,
    LayoutIrPage,
    LayoutIrTable,
    LayoutIrWidget,
    LayoutIrWidgetKind,
)

_SEMANTIC_PREAMBLE = """// Docuvate Export (semantisch). Quelle: Layout IR v1
// Stile: hier zentral anpassen, unten steht nur Inhalt.
#set page(paper: "a4", margin: (x: 14mm, y: 14mm))
#set text(font: "Liberation Sans", size: 10pt, lang: "de")
#set par(spacing: 0.85em)
#show heading.where(level: 1): set text(size: 14pt, weight: "bold")
#show heading.where(level: 2): set text(size: 11pt, weight: "bold")
#show heading: set block(above: 1.1em, below: 0.5em)

#let small(body) = text(size: 8pt, fill: luma(80), body)
#let fields(..cells) = table(
  columns: (auto, 1fr), stroke: none, inset: (x: 0pt, y: 2pt),
  align: (left, left), ..cells,
)
#let form-table(columns: (auto, 1fr, auto), ..cells) = table(
  columns: columns, stroke: 0.5pt, inset: 4pt,
  align: (left, left, right), ..cells,
)

"""


def _escape_semantic_inline(text: str) -> str:
    """Minimal escaping: keep dates like 01.01. - 31.12. readable (no \\-)."""
    stripped = text.replace("\r", "")
    if not stripped:
        return ""
    out = stripped.replace("\\", "\\\\")
    for ch in ("#", "$", "@", "[", "]", "_", "*"):
        out = out.replace(ch, f"\\{ch}")
    if out.startswith("="):
        out = "\\=" + out[1:]
    return out


def _cell_content(text: str) -> str:
    body = _escape_semantic_inline(text.strip())
    if not body:
        return "[ ]"
    return f"[{body}]"


@dataclass(frozen=True)
class _Region:
    y0: float
    y1: float
    x0: float
    x1: float

    def contains_norm(self, y: float, x: float) -> bool:
        return self.y0 <= y <= self.y1 and self.x0 <= x <= self.x1


def _table_regions(tables: tuple[LayoutIrTable, ...]) -> tuple[_Region, ...]:
    return tuple(
        _Region(t.y, t.y + t.height, t.x, t.x + t.width) for t in tables
    )


def _line_in_tables(line: LayoutIrLine, regions: tuple[_Region, ...]) -> bool:
    cy = line.y + line.height * 0.5
    cx = line.x + line.width * 0.5
    return any(r.contains_norm(cy, cx) for r in regions)


def _median_font_size(lines: tuple[LayoutIrLine, ...]) -> float:
    sizes = [ln.font_size_pt for ln in lines if ln.font_size_pt and ln.font_size_pt > 0]
    if not sizes:
        return 10.0
    sizes.sort()
    return sizes[len(sizes) // 2]


def _heading_level(line: LayoutIrLine, median_pt: float) -> int | None:
    size = line.font_size_pt or median_pt
    text = line.text.strip()
    if not text or len(text) > 200:
        return None
    bold = line.weight == FontWeight.BOLD
    if size >= median_pt * 1.35 or (bold and size >= median_pt * 1.15):
        return 1
    if bold and size >= median_pt * 1.05:
        return 2
    if text.endswith(":") and len(text) < 80 and bold:
        return 2
    return None


def _lines_reading_order(page: LayoutIrPage) -> tuple[LayoutIrLine, ...]:
    if page.lines:
        return tuple(sorted(page.lines, key=lambda ln: (ln.y, ln.x)))
    buckets: dict[int, list] = {}
    for block in page.blocks:
        key = int(round(block.y * 10_000))
        buckets.setdefault(key, []).append(block)
    synthetic: list[LayoutIrLine] = []
    for key in sorted(buckets):
        row = sorted(buckets[key], key=lambda b: b.x)
        text = "".join(b.text for b in row).strip()
        if not text:
            continue
        first = row[0]
        synthetic.append(
            LayoutIrLine(
                page=page.page,
                x=first.x,
                y=first.y,
                width=max(b.x + b.width for b in row) - first.x,
                height=max(b.height for b in row),
                text=text,
                font_family=first.font_family,
                font_size_pt=first.font_size_pt,
                weight=first.weight,
                align=first.align,
                block_index=first.block_index,
            )
        )
    return tuple(synthetic)


def _render_table(table: LayoutIrTable) -> str:
    cols = max(table.column_count, 1)
    col_spec = ", ".join(["auto"] * cols)
    cells: list[str] = []
    for row in table.rows:
        for cell in row:
            cells.append(_cell_content(cell.text))
    if not cells:
        return ""
    inner = ", ".join(cells)
    return f"#table(\n  columns: ({col_spec}),\n  stroke: 0.5pt,\n  inset: 4pt,\n  {inner},\n)\n"


def _render_widget(widget: LayoutIrWidget) -> str:
    if widget.kind == LayoutIrWidgetKind.CHECKBOX:
        mark = "[x]" if widget.checked else "[ ]"
        label = widget.field_name or widget.value or "Checkbox"
        return f"{mark} {_escape_semantic_inline(label)}\n"
    value = widget.value.strip()
    if widget.field_name:
        return f"#fields({_cell_content(widget.field_name)}, {_cell_content(value)})\n"
    if value:
        return f"{_escape_semantic_inline(value)}\n"
    return ""


def _render_line(line: LayoutIrLine, median_pt: float) -> str:
    text = line.text.strip()
    if not text:
        return ""
    level = _heading_level(line, median_pt)
    body = _escape_semantic_inline(text)
    if level == 1:
        return f"= {body}\n\n"
    if level == 2:
        return f"== {body}\n\n"
    return f"{body}\n\n"


@dataclass(frozen=True)
class _FlowItem:
    y: float
    kind: str
    payload: object


def _page_body(page: LayoutIrPage) -> str:
    regions = _table_regions(page.tables)
    lines = _lines_reading_order(page)
    median = _median_font_size(lines)
    items: list[_FlowItem] = []
    for table in page.tables:
        items.append(_FlowItem(table.y, "table", table))
    for line in lines:
        if _line_in_tables(line, regions):
            continue
        items.append(_FlowItem(line.y, "line", line))
    for widget in page.widgets:
        items.append(_FlowItem(widget.y, "widget", widget))
    items.sort(key=lambda it: (it.y, 0 if it.kind == "line" else 1))

    parts: list[str] = []
    for item in items:
        if item.kind == "table":
            part = _render_table(item.payload)  # type: ignore[arg-type]
        elif item.kind == "widget":
            part = _render_widget(item.payload)  # type: ignore[arg-type]
        else:
            part = _render_line(item.payload, median)  # type: ignore[arg-type]
        if part:
            parts.append(part)
    covered = "".join(parts)
    for block in sorted(page.blocks, key=lambda b: (b.y, b.x)):
        text = block.text.strip()
        if text and text not in covered:
            parts.append(f"{_escape_semantic_inline(text)}\n\n")
    return "".join(parts)


def layout_ir_to_typst_semantic(doc: LayoutIrDocument) -> str:
    body_parts: list[str] = []
    pages = sorted(doc.pages, key=lambda p: p.page)
    for idx, page in enumerate(pages):
        if len(pages) > 1:
            body_parts.append(f"// --- Seite {page.page} ---\n\n")
        body_parts.append(_page_body(page))
    return _SEMANTIC_PREAMBLE + "\n".join(body_parts).strip() + "\n"


_TOKEN_RE = re.compile(r"[\wäöüÄÖÜß]+", re.UNICODE)


def _append_tokens(text: str, seen: set[str], ordered: list[str]) -> None:
    for tok in _TOKEN_RE.findall(text):
        key = tok.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append(key)


def collect_layout_ir_tokens(doc: LayoutIrDocument) -> list[str]:
    """Normalized word tokens from IR text (for semantic export coverage tests)."""
    seen: set[str] = set()
    ordered: list[str] = []
    for page in doc.pages:
        for line in _lines_reading_order(page):
            _append_tokens(line.text, seen, ordered)
        for table in page.tables:
            for row in table.rows:
                for cell in row:
                    _append_tokens(cell.text, seen, ordered)
        for widget in page.widgets:
            for field in (widget.field_name, widget.value):
                if field:
                    _append_tokens(field, seen, ordered)
        for block in page.blocks:
            _append_tokens(block.text, seen, ordered)
    return ordered


def tokens_from_pdf_text(pdf_bytes: bytes) -> set[str]:
    import io

    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(pdf_bytes))
    combined = "\n".join((page.extract_text() or "") for page in reader.pages)
    return {tok.lower() for tok in _TOKEN_RE.findall(combined)}
