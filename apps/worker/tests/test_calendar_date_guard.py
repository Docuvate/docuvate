# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.infrastructure.ml.value_types.field_suggestions import looks_like_calendar_date


def test_looks_like_calendar_date_accepts_common_formats() -> None:
    assert looks_like_calendar_date("15.03.2024")
    assert looks_like_calendar_date("2024-03-15")
    assert looks_like_calendar_date("15/03/2024")


def test_looks_like_calendar_date_rejects_invoice_numbers() -> None:
    assert not looks_like_calendar_date("NW-2026-0042")
    assert not looks_like_calendar_date("INV-2024-77")
    assert not looks_like_calendar_date("Rechnungsnummer")
