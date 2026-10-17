# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations


def parse_money_amount(token: str) -> float | None:
    cleaned = token.strip().replace("EUR", "").replace("€", "").strip()
    if not cleaned or not any(ch.isdigit() for ch in cleaned):
        return None
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def vat_sum_consistency_hint(candidate_value: float, peer_values: list[float]) -> float:
    if candidate_value <= 0.0:
        return 0.0
    tolerance = max(0.02, candidate_value * 0.002)
    peers = sorted(value for value in peer_values if value > 0.0 and value < candidate_value)
    for index, left in enumerate(peers):
        for right in peers[index + 1 :]:
            if abs(left + right - candidate_value) <= tolerance:
                return 1.0
    return 0.0
