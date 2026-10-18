# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Token multiset coverage and reading-order metrics for semantic Typst export."""

from __future__ import annotations

import io
import re
from collections import Counter

from pypdf import PdfReader

_TOKEN_RE = re.compile(r"[\wäöüÄÖÜß]+", re.UNICODE)


def tokenize_words(text: str) -> list[str]:
    return [tok.lower() for tok in _TOKEN_RE.findall(text)]


def tokens_from_pdf_sequence(pdf_bytes: bytes) -> list[str]:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    combined = "\n".join((page.extract_text() or "") for page in reader.pages)
    return tokenize_words(combined)


def multiset_token_coverage(expected: list[str], actual: list[str]) -> float:
    if not expected:
        return 1.0
    need = Counter(expected)
    have = Counter(actual)
    hit = sum(min(need[tok], have[tok]) for tok in need)
    total = sum(need.values())
    return hit / total if total else 1.0


def _lcs_length(a: list[str], b: list[str]) -> int:
    if not a or not b:
        return 0
    prev = [0] * (len(b) + 1)
    for i in range(1, len(a) + 1):
        curr = [0] * (len(b) + 1)
        ai = a[i - 1]
        for j in range(1, len(b) + 1):
            if ai == b[j - 1]:
                curr[j] = prev[j - 1] + 1
            else:
                curr[j] = max(prev[j], curr[j - 1])
        prev = curr
    return prev[len(b)]


def reading_order_lcs_ratio(expected: list[str], actual: list[str]) -> float:
    if not expected:
        return 1.0
    lcs = _lcs_length(expected, actual)
    return lcs / len(expected)


def tokens_from_pdf_text(pdf_bytes: bytes) -> set[str]:
    return set(tokens_from_pdf_sequence(pdf_bytes))


_CELL_TEXT_RE = re.compile(r"\[([^\]]*)\]")
_PLAIN_LINE_RE = re.compile(r"^(?![#=]).+", re.MULTILINE)


def _typst_document_body(typst: str) -> str:
    lines = typst.splitlines()
    body_lines: list[str] = []
    past_preamble = False
    for line in lines:
        stripped = line.strip()
        if not past_preamble:
            if stripped.startswith("#set page"):
                past_preamble = True
            continue
        if stripped.startswith("#set page") or stripped.startswith("#pagebreak"):
            continue
        body_lines.append(line)
    return "\n".join(body_lines)


def tokens_from_typst_source(typst: str) -> list[str]:
    """Token sequence from emitted Typst body text (independent of IR flow helpers)."""
    body = _typst_document_body(typst)
    tokens: list[str] = []
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("//"):
            continue
        if stripped.startswith("="):
            tokens.extend(tokenize_words(stripped.lstrip("= ")))
            continue
        if stripped.startswith("#") and "[" not in stripped:
            continue
        if any(
            token in stripped
            for token in ("columns:", "stroke:", "inset:", "align:", "..cells")
        ):
            continue
        if stripped.startswith("[x]"):
            tokens.extend(tokenize_words(stripped.replace("[x]", "").strip()))
            continue
        if "[" in stripped:
            for match in _CELL_TEXT_RE.finditer(stripped):
                inner = match.group(1).strip()
                if inner in ("x",):
                    continue
                if inner:
                    tokens.extend(tokenize_words(inner))
            continue
        tokens.extend(tokenize_words(stripped))
    return tokens
