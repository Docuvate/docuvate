# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import re

_SENDER_LABEL_PREFIX = re.compile(
    r"^(?:(?:kurzer\s+)?absender|vendor|sender|lieferant|from|von)\s*:\s*",
    re.IGNORECASE,
)


def strip_leading_sender_label_prefixes(value: str) -> str:
    """Remove repeated Absender/Vendor-style label prefixes from an extracted value."""
    out = value.strip()
    while True:
        match = _SENDER_LABEL_PREFIX.match(out)
        if not match:
            break
        out = out[match.end() :].strip()
    return out
