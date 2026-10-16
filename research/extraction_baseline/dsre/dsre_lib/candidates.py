# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

from dsre_lib.layout_docs import LayoutBlock, LayoutDocument
from dsre_lib.normalize import normalize_value

MAX_CANDIDATES_PER_DOC = 256
MAX_WORD_WINDOW = 10


@dataclass(frozen=True)
class SpanCandidate:
    text: str
    char_start: int
    char_end: int
    xc: float
    yc: float
    w: float
    h: float


def _bbox_from_blocks(blocks: list[LayoutBlock]) -> tuple[float, float, float, float]:
    x0 = min(b.x for b in blocks)
    y0 = min(b.y for b in blocks)
    x1 = max(b.x + b.width for b in blocks)
    y1 = max(b.y + b.height for b in blocks)
    xc = (x0 + x1) * 0.5
    yc = (y0 + y1) * 0.5
    return xc, yc, max(x1 - x0, 1e-6), max(y1 - y0, 1e-6)


def generate_candidates(doc: LayoutDocument) -> list[SpanCandidate]:
    """Layout-only span candidates (no gold, no keyword filters)."""
    seen: set[str] = set()
    out: list[SpanCandidate] = []

    def add_span(text: str, char_start: int, char_end: int, blocks: list[LayoutBlock]) -> None:
        body = text.strip()
        if not body or len(body) > 200:
            return
        norm = normalize_value(body)
        if not norm or norm in seen:
            return
        seen.add(norm)
        xc, yc, w, h = _bbox_from_blocks(blocks)
        out.append(
            SpanCandidate(
                text=body,
                char_start=char_start,
                char_end=char_end,
                xc=xc,
                yc=yc,
                w=w,
                h=h,
            )
        )

    # Line-level blocks (LayoutIR-style lines).
    for block in doc.blocks:
        add_span(block.text, block.char_start, block.char_end, [block])

    # Word windows in reading order (sliding over block words).
    words: list[tuple[str, int, int, LayoutBlock]] = []
    for block in doc.blocks:
        for token in block.text.split():
            if not token:
                continue
            idx = block.text.find(token)
            if idx < 0:
                continue
            words.append(
                (
                    token,
                    block.char_start + idx,
                    block.char_start + idx + len(token),
                    block,
                )
            )

    for start in range(len(words)):
        window_blocks: list[LayoutBlock] = []
        for length in range(1, min(MAX_WORD_WINDOW, len(words) - start) + 1):
            chunk = words[start : start + length]
            text = " ".join(w[0] for w in chunk)
            char_start = chunk[0][1]
            char_end = chunk[-1][2]
            window_blocks = [w[3] for w in chunk]
            add_span(text, char_start, char_end, window_blocks)
            if len(out) >= MAX_CANDIDATES_PER_DOC:
                return out[:MAX_CANDIDATES_PER_DOC]

    return out[:MAX_CANDIDATES_PER_DOC]


def gold_candidate_index(candidates: list[SpanCandidate], gold_value: str | None) -> int:
    if not gold_value:
        return -1
    target = normalize_value(gold_value)
    if not target:
        return -1
    for idx, cand in enumerate(candidates):
        if normalize_value(cand.text) == target:
            return idx
    return -1
