"""Readable, human-editable Typst export from layout IR (semantisch mode)."""

from __future__ import annotations

import re
from dataclasses import dataclass, replace

from docuvate_worker.domain.layout_ir import (
    FontWeight,
    LayoutIrBlock,
    LayoutIrCellRole,
    LayoutIrDocument,
    LayoutIrLine,
    LayoutIrPage,
    LayoutIrTable,
    LayoutIrTableCell,
    LayoutIrVectorKind,
    LayoutIrWidget,
    LayoutIrWidgetKind,
)
from docuvate_worker.infrastructure.layout.semantic_typst_metrics import tokenize_words

_SEMANTIC_PREAMBLE = """// Docuvate Export (semantisch). Quelle: Layout IR v1
#set text(font: "Liberation Sans", size: 10pt, lang: "de")
#set par(spacing: 0.85em)
#show heading.where(level: 1): set text(size: 14pt, weight: "bold")
#show heading.where(level: 2): set text(size: 11pt, weight: "bold")
#show heading: set block(above: 1.1em, below: 0.5em)

#let fields(..cells) = table(
  columns: (auto, 1fr), stroke: none, inset: (x: 0pt, y: 2pt),
  align: (left, left), ..cells,
)

"""

def _escape_semantic_inline(text: str) -> str:
    stripped = text.replace("\r", "")
    if not stripped:
        return ""
    out = stripped.replace("\\", "\\\\")
    for ch in ("#", "$", "@", "[", "]", "_", "*"):
        out = out.replace(ch, f"\\{ch}")
    return out


def _escape_semantic_line(line: str) -> str:
    if not line:
        return ""
    raw = line
    if re.match(r"^\d+\.\s", raw):
        return "\\" + _escape_semantic_inline(raw)
    for prefix in ("- ", "+ ", "/ ", "//"):
        if raw.startswith(prefix):
            return "\\" + _escape_semantic_inline(raw)
    out = _escape_semantic_inline(raw)
    out = out.replace("//", "\\/\\/").replace("~", "\\~").replace("`", "\\`").replace("<", "\\<")
    return out


def _escape_semantic_text(text: str) -> str:
    lines = text.replace("\r", "").split("\n")
    return "\n".join(_escape_semantic_line(ln) for ln in lines)


def _cell_content(text: str) -> str:
    body = _escape_semantic_text(text.strip())
    if not body:
        return "[ ]"
    return f"[{body}]"


@dataclass(frozen=True)
class _Region:
    y0: float
    y1: float
    x0: float
    x1: float

    def contains_center(self, y: float, x: float) -> bool:
        return self.y0 <= y <= self.y1 and self.x0 <= x <= self.x1


def _expand_table_region(table: LayoutIrTable, page: LayoutIrPage) -> _Region:
    x0, y0 = table.x, table.y
    x1, y1 = table.x + table.width, table.y + table.height
    for vector in page.vectors:
        if vector.kind != LayoutIrVectorKind.LINE:
            continue
        vx1 = vector.x + vector.width
        vy1 = vector.y + vector.height
        overlaps_y = vy1 >= y0 - 0.01 and vector.y <= y1 + 0.01
        if not overlaps_y:
            continue
        if vector.width > vector.height * 2:
            x0 = min(x0, vector.x)
            x1 = max(x1, vx1)
        elif vector.height > vector.width * 2:
            y0 = min(y0, vector.y)
            y1 = max(y1, vy1)
    return _Region(y0, y1, x0, x1)


def _line_from_block(block: LayoutIrBlock, page_num: int) -> LayoutIrLine:
    return LayoutIrLine(
        page=page_num,
        x=block.x,
        y=block.y,
        width=block.width,
        height=block.height,
        text=block.text,
        font_family=block.font_family,
        font_size_pt=block.font_size_pt,
        weight=block.weight,
        align=block.align,
        block_index=block.block_index,
    )


def _lines_for_page(page: LayoutIrPage) -> tuple[LayoutIrLine, ...]:
    if page.lines:
        merged: list[LayoutIrLine] = list(page.lines)
        seen = {ln.text.strip() for ln in merged if ln.text.strip()}
        for block in page.blocks:
            text = block.text.strip()
            if not text or text in seen:
                continue
            merged.append(_line_from_block(block, page.page))
            seen.add(text)
        return tuple(merged)
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


def _cluster_row_y(
    lines: tuple[LayoutIrLine, ...], y_tol: float = 0.02
) -> list[list[LayoutIrLine]]:
    ordered = sorted(lines, key=lambda ln: (ln.y, ln.x))
    rows: list[list[LayoutIrLine]] = []
    current: list[LayoutIrLine] = []
    ref_y: float | None = None
    for line in ordered:
        cy = line.y + line.height * 0.5
        if ref_y is None or abs(cy - ref_y) <= y_tol:
            current.append(line)
            ref_y = cy if ref_y is None else (ref_y + cy) * 0.5
        else:
            rows.append(current)
            current = [line]
            ref_y = cy
    if current:
        rows.append(current)
    return rows


def _cluster_columns(
    lines: tuple[LayoutIrLine, ...], min_gap: float = 0.12
) -> list[list[LayoutIrLine]]:
    if not lines:
        return []
    by_center = sorted(
        ((ln.x + ln.width * 0.5, ln) for ln in lines),
        key=lambda pair: pair[0],
    )
    centers: list[float] = []
    for cx, _ln in by_center:
        if not centers or cx - centers[-1] > 0.03:
            centers.append(cx)
        else:
            centers[-1] = (centers[-1] + cx) * 0.5
    if len(centers) == 1:
        return [[ln for _, ln in by_center]]
    col_centers: list[float] = [centers[0]]
    for cx in centers[1:]:
        if cx - col_centers[-1] >= min_gap:
            col_centers.append(cx)
        else:
            col_centers[-1] = (col_centers[-1] + cx) * 0.5
    columns: list[list[LayoutIrLine]] = [[] for _ in col_centers]
    for cx, ln in by_center:
        idx = min(range(len(col_centers)), key=lambda i: abs(cx - col_centers[i]))
        columns[idx].append(ln)
    return [col for col in columns if col]


def _lines_column_major(lines: tuple[LayoutIrLine, ...]) -> tuple[LayoutIrLine, ...]:
    columns = _cluster_columns(lines)
    if len(columns) <= 1:
        return tuple(sorted(lines, key=lambda ln: (ln.y, ln.x)))
    out: list[LayoutIrLine] = []
    for col in columns:
        out.extend(sorted(col, key=lambda ln: (ln.y, ln.x)))
    return tuple(out)


def _is_full_width_line(line: LayoutIrLine) -> bool:
    return line.width > 0.38


def _lines_semantic_flow_order(
    lines: tuple[LayoutIrLine, ...], regions: tuple[_Region, ...]
) -> tuple[LayoutIrLine, ...]:
    usable = tuple(ln for ln in lines if not _line_in_tables(ln, regions))
    wide = tuple(ln for ln in usable if _is_full_width_line(ln))
    narrow = tuple(ln for ln in usable if not _is_full_width_line(ln))
    ordered: list[LayoutIrLine] = []
    ordered.extend(sorted(wide, key=lambda ln: (ln.y, ln.x)))
    if len(_cluster_columns(narrow)) >= 2:
        ordered.extend(_lines_column_major(narrow))
    else:
        ordered.extend(sorted(narrow, key=lambda ln: (ln.y, ln.x)))
    return tuple(ordered)


def _enrich_table(table: LayoutIrTable, page: LayoutIrPage) -> LayoutIrTable:
    region = _expand_table_region(table, page)
    candidates = [
        ln
        for ln in _lines_for_page(page)
        if region.contains_center(ln.y + ln.height * 0.5, ln.x + ln.width * 0.5)
    ]
    if not candidates:
        return table
    row_groups = _cluster_row_y(tuple(candidates))
    grid: list[list[str]] = []
    roles: list[list[LayoutIrCellRole | None]] = []
    max_cols = 0
    for row_idx, group in enumerate(row_groups):
        row_lines = sorted(group, key=lambda ln: ln.x)
        texts = [ln.text.strip() for ln in row_lines if ln.text.strip()]
        if not texts:
            continue
        grid.append(texts)
        row_roles: list[LayoutIrCellRole | None] = []
        for ln in row_lines:
            if not ln.text.strip():
                continue
            if row_idx == 0:
                role = LayoutIrCellRole.HEADER
            elif ln.text.strip().endswith(":"):
                role = LayoutIrCellRole.LABEL
            else:
                role = None
            row_roles.append(role)
        roles.append(row_roles)
        max_cols = max(max_cols, len(texts))
    if max_cols <= 1 and table.column_count <= 1:
        return table
    cells_rows: list[tuple[LayoutIrTableCell, ...]] = []
    for r_idx, texts in enumerate(grid):
        padded = texts + [""] * (max_cols - len(texts))
        row_cells: list[LayoutIrTableCell] = []
        for c_idx, text in enumerate(padded):
            if not text:
                continue
            role = None
            if r_idx < len(roles) and c_idx < len(roles[r_idx]):
                role = roles[r_idx][c_idx]
            row_cells.append(
                LayoutIrTableCell(
                    text=text,
                    x=table.x,
                    y=table.y,
                    width=table.width / max_cols,
                    height=table.height / max(len(grid), 1),
                    cell_role=role,
                )
            )
        if row_cells:
            cells_rows.append(tuple(row_cells))
    if not cells_rows:
        return table
    return replace(table, rows=tuple(cells_rows), column_count=max_cols)


def _table_regions(tables: tuple[LayoutIrTable, ...], page: LayoutIrPage) -> tuple[_Region, ...]:
    return tuple(_expand_table_region(t, page) for t in tables)


def _line_in_tables(line: LayoutIrLine, regions: tuple[_Region, ...]) -> bool:
    cy = line.y + line.height * 0.5
    cx = line.x + line.width * 0.5
    return any(r.contains_center(cy, cx) for r in regions)


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


def _render_table(table: LayoutIrTable) -> str:
    cols = max(table.column_count, 1)
    col_spec = ", ".join(["auto"] * cols)
    flat: list[str] = []
    header_cells: list[str] = []
    body_rows: list[tuple[LayoutIrTableCell, ...]] = list(table.rows)
    if table.rows and len(table.rows) >= 2:
        first = table.rows[0]
        if any(c.cell_role == LayoutIrCellRole.HEADER for c in first) or len(first) >= 2:
            header_cells = [_cell_content(c.text) for c in first]
            body_rows = list(table.rows[1:])
    for row in body_rows:
        for cell in row:
            flat.append(_cell_content(cell.text))
    parts: list[str] = [f"#table(\n  columns: ({col_spec}),\n  stroke: 0.5pt,\n  inset: 4pt,"]
    if header_cells:
        parts.append(f"  table.header({', '.join(header_cells)}),")
    if flat:
        parts.append(f"  {', '.join(flat)},")
    parts.append(")\n")
    return "\n".join(parts)


def _line_index(lines: tuple[LayoutIrLine, ...], target: LayoutIrLine) -> int | None:
    for idx, line in enumerate(lines):
        if line is target:
            return idx
        if (
            line.text == target.text
            and abs(line.x - target.x) < 1e-6
            and abs(line.y - target.y) < 1e-6
        ):
            return idx
    return None


def _label_line_for_widget(
    widget: LayoutIrWidget, lines: tuple[LayoutIrLine, ...], used: set[int]
) -> LayoutIrLine | None:
    wy = widget.y + widget.height * 0.5
    best: tuple[float, LayoutIrLine] | None = None
    for idx, line in enumerate(lines):
        if idx in used:
            continue
        text = line.text.strip()
        if not text:
            continue
        ly = line.y + line.height * 0.5
        if abs(ly - wy) > 0.03:
            continue
        line_end = line.x + line.width
        if line_end <= widget.x + 0.08:
            dist = widget.x - line_end
            if best is None or dist < best[0]:
                best = (dist, line)
    if best:
        return best[1]
    for idx, line in enumerate(lines):
        if idx in used:
            continue
        text = line.text.strip()
        if not text:
            continue
        if line.y + line.height <= widget.y and widget.y - (line.y + line.height) < 0.04:
            if line.x <= widget.x + 0.05:
                return line
    return None


def _render_widget(
    widget: LayoutIrWidget,
    lines: tuple[LayoutIrLine, ...],
    used_line_idx: set[int],
) -> str:
    if widget.kind == LayoutIrWidgetKind.CHECKBOX:
        mark = "[x]" if widget.checked else "[ ]"
        label_line = _label_line_for_widget(widget, lines, used_line_idx)
        label = label_line.text.strip() if label_line else (widget.field_name or "Checkbox")
        if label_line is not None:
            idx = _line_index(lines, label_line)
            if idx is not None:
                used_line_idx.add(idx)
        return f"{mark} {_escape_semantic_text(label)}\n"
    value = widget.value.strip()
    label_line = _label_line_for_widget(widget, lines, used_line_idx)
    if label_line is not None:
        idx = _line_index(lines, label_line)
        if idx is not None:
            used_line_idx.add(idx)
        label = label_line.text.strip()
        return f"#fields({_cell_content(label)}, {_cell_content(value)})\n"
    if widget.field_name and value:
        return f"#fields({_cell_content(widget.field_name)}, {_cell_content(value)})\n"
    if value:
        return f"{_escape_semantic_text(value)}\n"
    return ""


def _render_line(line: LayoutIrLine, median_pt: float) -> str:
    text = line.text.strip()
    if not text:
        return ""
    level = _heading_level(line, median_pt)
    body = _escape_semantic_text(text)
    if level == 1:
        return f"= {body}\n\n"
    if level == 2:
        return f"== {body}\n\n"
    return f"{body}\n\n"


def _render_label_value_pair(left: LayoutIrLine, right: LayoutIrLine) -> str:
    return f"#fields({_cell_content(left.text)}, {_cell_content(right.text)})\n\n"


@dataclass(frozen=True)
class _FlowItem:
    order: int
    x: float
    kind: str
    payload: object


def _table_flow_order(
    flow_lines: tuple[LayoutIrLine, ...],
    regions: tuple[_Region, ...],
    table: LayoutIrTable,
) -> int:
    indices = [i for i, ln in enumerate(flow_lines) if _line_in_tables(ln, regions)]
    if indices:
        return min(indices)
    return int(table.y * 10_000)


def _page_set_block(page: LayoutIrPage) -> str:
    w, h = page.width_pt, page.height_pt
    margin = "margin: (x: 14mm, y: 14mm)"
    if w <= 0 or h <= 0:
        return f"#set page(paper: \"a4\", {margin})\n\n"
    portrait_a4 = abs(w - 595.28) < 2 and abs(h - 841.89) < 3
    if portrait_a4:
        return f"#set page(paper: \"a4\", {margin})\n\n"
    return f"#set page(width: {w:.2f}pt, height: {h:.2f}pt, {margin})\n\n"


def _page_body(page: LayoutIrPage) -> tuple[str, int]:
    enriched_tables = tuple(_enrich_table(t, page) for t in page.tables)
    regions = _table_regions(enriched_tables, page)
    all_lines = _lines_for_page(page)
    flow_lines = _lines_semantic_flow_order(all_lines, regions)
    median = _median_font_size(flow_lines)
    used_line_idx: set[int] = set()
    items: list[_FlowItem] = []
    for table in enriched_tables:
        t_order = _table_flow_order(flow_lines, regions, table)
        items.append(_FlowItem(t_order, table.x, "table", table))
    widget_label_idx: set[int] = set()
    for widget in page.widgets:
        label = _label_line_for_widget(widget, flow_lines, set())
        if label is not None:
            li = _line_index(flow_lines, label)
            if li is not None:
                widget_label_idx.add(li)
    for widget in page.widgets:
        w_order = next(
            (i for i, ln in enumerate(flow_lines) if abs(ln.y - widget.y) < 0.04),
            int(widget.y * 10_000),
        )
        items.append(_FlowItem(w_order, widget.x, "widget", widget))
    for idx, line in enumerate(flow_lines):
        if _line_in_tables(line, regions):
            continue
        if idx in widget_label_idx:
            continue
        if any(abs(line.y - w.y) < 0.03 and abs(line.x - w.x) < 0.15 for w in page.widgets):
            continue
        items.append(_FlowItem(idx, line.x, "line", (idx, line)))
    items.sort(key=lambda it: (it.order, it.x, 0 if it.kind == "line" else 1))

    parts: list[str] = []
    consumed: set[int] = set()
    i = 0
    flow_list = list(items)
    while i < len(flow_list):
        item = flow_list[i]
        if item.kind == "line":
            idx, line = item.payload  # type: ignore[misc]
            if idx in consumed or idx in used_line_idx:
                i += 1
                continue
            text = line.text.strip()
            if text.endswith(":"):
                if i + 1 < len(flow_list) and flow_list[i + 1].kind == "line":
                    nidx, nline = flow_list[i + 1].payload  # type: ignore[misc]
                    if nidx not in consumed and abs(nline.y - line.y) < 0.03 and nline.x > line.x:
                        parts.append(_render_label_value_pair(line, nline))
                        consumed.add(idx)
                        consumed.add(nidx)
                        i += 2
                        continue
            part = _render_line(line, median)
            if part:
                parts.append(part)
                consumed.add(idx)
            i += 1
            continue
        if item.kind == "table":
            parts.append(_render_table(item.payload))  # type: ignore[arg-type]
        elif item.kind == "widget":
            parts.append(_render_widget(item.payload, flow_lines, used_line_idx))  # type: ignore[arg-type]
        i += 1

    leftover = sum(
        1
        for idx, line in enumerate(flow_lines)
        if idx not in consumed
        and idx not in used_line_idx
        and not _line_in_tables(line, regions)
        and line.text.strip()
    )
    return "".join(parts), leftover


def semantic_export_leftover_line_count(doc: LayoutIrDocument) -> int:
    total = 0
    for page in doc.pages:
        _, leftover = _page_body(page)
        total += leftover
    return total


def layout_ir_to_typst_semantic(doc: LayoutIrDocument) -> str:
    body_parts: list[str] = [_SEMANTIC_PREAMBLE]
    pages = sorted(doc.pages, key=lambda p: p.page)
    for idx, page in enumerate(pages):
        if idx > 0:
            body_parts.append("#pagebreak()\n\n")
        body_parts.append(_page_set_block(page))
        page_text, _leftover = _page_body(page)
        body_parts.append(page_text)
    return "".join(body_parts).strip() + "\n"


def _page_semantic_token_events(page: LayoutIrPage) -> list[str]:
    enriched_tables = tuple(_enrich_table(t, page) for t in page.tables)
    regions = _table_regions(enriched_tables, page)
    flow_lines = _lines_semantic_flow_order(_lines_for_page(page), regions)
    events: list[tuple[int, list[str]]] = []
    widget_label_idx: set[int] = set()
    for widget in page.widgets:
        label = _label_line_for_widget(widget, flow_lines, set())
        if label is not None:
            li = _line_index(flow_lines, label)
            if li is not None:
                widget_label_idx.add(li)
    for idx, line in enumerate(flow_lines):
        if _line_in_tables(line, regions):
            continue
        if idx in widget_label_idx:
            continue
        if any(abs(line.y - w.y) < 0.03 and abs(line.x - w.x) < 0.15 for w in page.widgets):
            continue
        events.append((idx, tokenize_words(line.text)))
    for table in enriched_tables:
        order = _table_flow_order(flow_lines, regions, table)
        row_tokens: list[str] = []
        for row in table.rows:
            for cell in row:
                row_tokens.extend(tokenize_words(cell.text))
        events.append((order, row_tokens))
    for widget in page.widgets:
        w_order = next(
            (i for i, ln in enumerate(flow_lines) if abs(ln.y - widget.y) < 0.04),
            int(widget.y * 10_000),
        )
        chunk: list[str] = []
        label = _label_line_for_widget(widget, flow_lines, set())
        if label:
            chunk.extend(tokenize_words(label.text))
        if widget.value:
            chunk.extend(tokenize_words(widget.value))
        elif widget.field_name and widget.kind == LayoutIrWidgetKind.CHECKBOX:
            chunk.extend(tokenize_words(widget.field_name))
        events.append((w_order, chunk))
    events.sort(key=lambda item: item[0])
    out: list[str] = []
    for _, chunk in events:
        out.extend(chunk)
    return out


def semantic_ir_token_sequence(doc: LayoutIrDocument) -> list[str]:
    tokens: list[str] = []
    for page in sorted(doc.pages, key=lambda p: p.page):
        tokens.extend(_page_semantic_token_events(page))
    return tokens


def collect_layout_ir_tokens(doc: LayoutIrDocument) -> list[str]:
    """Reading-order token sequence (with duplicates) for semantic export metrics."""
    return semantic_ir_token_sequence(doc)


def tokens_from_pdf_text(pdf_bytes: bytes) -> set[str]:
    from docuvate_worker.infrastructure.layout.semantic_typst_metrics import (
        tokens_from_pdf_text as _pdf_set,
    )

    return _pdf_set(pdf_bytes)
