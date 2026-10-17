# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import re
import unicodedata


def normalize_value(text: str) -> str:
    folded = unicodedata.normalize("NFKC", text or "")
    folded = folded.lower().strip()
    folded = re.sub(r"\s+", " ", folded)
    folded = re.sub(r"[,.\s]+$", "", folded)
    return folded
