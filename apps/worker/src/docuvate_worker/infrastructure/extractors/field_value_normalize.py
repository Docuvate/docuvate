# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

_SENDER_LABEL_PREFIXES: tuple[str, ...] = (
    "absender:",
    "kurzer absender:",
    "vendor:",
    "sender:",
    "lieferant:",
    "from:",
    "von:",
)


def _strip_one_sender_prefix(value: str) -> tuple[str, bool]:
    lower = value.lower()
    for prefix in _SENDER_LABEL_PREFIXES:
        if lower.startswith(prefix):
            return value[len(prefix) :].strip(), True
    return value, False


def strip_leading_sender_label_prefixes(value: str) -> str:
    """Remove repeated Absender/Vendor-style label prefixes from an extracted value."""
    out = value.strip()
    while True:
        out, changed = _strip_one_sender_prefix(out)
        if not changed:
            break
    return out
