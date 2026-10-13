# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Commercially clean synthetic layout documents for KV role head training."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

RoleLabel = Literal["other", "key", "value"]


@dataclass(frozen=True)
class SyntheticEntity:
    page: int
    x: float
    y: float
    width: float
    height: float
    text: str
    role: RoleLabel


@dataclass(frozen=True)
class SyntheticDocument:
    document_id: str
    entities: tuple[SyntheticEntity, ...]
    links: tuple[tuple[int, int], ...]


def _pair(row: float, label: str, value: str, page: int = 1) -> list[SyntheticEntity]:
    return [
        SyntheticEntity(page, 0.08, row, 0.18, 0.02, label, "key"),
        SyntheticEntity(page, 0.32, row - 0.002, 0.25, 0.02, value, "value"),
    ]


def build_synthetic_documents() -> list[SyntheticDocument]:
    docs: list[SyntheticDocument] = []
    rows = [
        ("Invoice No:", "INV-2026-014"),
        ("Date:", "2026-03-13"),
        ("Customer:", "Muster GmbH"),
        ("Total:", "EUR 128.40"),
        ("Tax ID:", "DE123456789"),
        ("Rechnungsnummer:", "R-7781"),
        ("Lieferdatum:", "12.03.2026"),
        ("Bestellnummer:", "PO-9912"),
    ]
    for idx, (label, value) in enumerate(rows):
        y = 0.12 + idx * 0.05
        entities = tuple(_pair(y, label, value))
        docs.append(SyntheticDocument(f"synthetic-{idx}", entities, ((0, 1),)))
    header = (
        SyntheticEntity(1, 0.1, 0.05, 0.4, 0.03, "Tax Invoice", "other"),
        SyntheticEntity(1, 0.55, 0.05, 0.3, 0.03, "Page 1/1", "other"),
    )
    body = tuple(_pair(0.2, "Vendor:", "Docuvate Demo Store"))
    docs.append(SyntheticDocument("synthetic-header", header + body, ((2, 3),)))
    return docs
