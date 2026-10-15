# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import re
from dataclasses import dataclass

from closed_form_ml.interfaces import KVPair


_KEY_VALUE_RE = re.compile(
    r"(?P<key>[A-Za-zÄÖÜäöüß][\w\s./\-]{0,40}?)\s*[:：]\s*(?P<value>[^\n;|]{1,120})",
)


@dataclass
class RegexKVExtractor:
    """Baseline pattern KV (no ML)."""

    min_confidence: float = 0.55

    def extract(self, document_text: str, *, entities: list[str] | None = None) -> list[KVPair]:
        pairs: list[KVPair] = []
        for match in _KEY_VALUE_RE.finditer(document_text):
            key = match.group("key").strip()
            value = match.group("value").strip()
            if len(key) < 2 or len(value) < 1:
                continue
            pairs.append(KVPair(key, value, 0.6))
        return pairs


@dataclass
class LayoutRidgeKVExtractor:
    """Placeholder: CE layout KV head needs blocks + representation (see eval/layout_kv_roles)."""

    def extract(self, document_text: str, *, entities: list[str] | None = None) -> list[KVPair]:
        return RegexKVExtractor().extract(document_text, entities=entities)
