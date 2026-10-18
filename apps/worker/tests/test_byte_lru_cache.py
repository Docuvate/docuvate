# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.infrastructure.layout.byte_lru_cache import ByteBoundedLruCache


def test_byte_lru_evicts_to_stay_under_budget() -> None:
    cache: ByteBoundedLruCache[str, bytes] = ByteBoundedLruCache(9, len)
    assert cache.set("a", b"12345") is True
    assert cache.set("b", b"12345") is True
    assert cache.total_bytes <= 10
    assert cache.get("a") is None
    assert cache.get("b") == b"12345"


def test_byte_lru_skips_oversized_entry() -> None:
    cache: ByteBoundedLruCache[str, bytes] = ByteBoundedLruCache(100, len)
    assert cache.set("big", b"x" * 50, max_entry_bytes=10) is False
    assert cache.total_bytes == 0
