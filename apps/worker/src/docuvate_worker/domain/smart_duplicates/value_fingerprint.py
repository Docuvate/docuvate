# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import unicodedata


def token_has_decimal_digit(token: str) -> bool:
    return any(unicodedata.category(char) == 'Nd' for char in token)


def value_fingerprint_tokens(lines: list[str]) -> set[str]:
    """Tokens containing Unicode decimal digits (document-type agnostic)."""
    tokens: set[str] = set()
    for line in lines:
        for token in line.upper().split():
            if token_has_decimal_digit(token):
                tokens.add(token)
    return tokens
