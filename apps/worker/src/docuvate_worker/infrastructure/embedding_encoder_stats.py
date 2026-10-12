# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Test hook: count passage embedding batches."""

from __future__ import annotations

_passage_batch_calls = 0


def reset_passage_batch_calls() -> None:
    global _passage_batch_calls  # noqa: PLW0603
    _passage_batch_calls = 0


def record_passage_batch(text_count: int) -> None:
    global _passage_batch_calls  # noqa: PLW0603
    if text_count > 0:
        _passage_batch_calls += 1


def passage_batch_calls() -> int:
    return _passage_batch_calls
