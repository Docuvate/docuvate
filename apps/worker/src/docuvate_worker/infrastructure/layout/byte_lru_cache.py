# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Byte-bounded LRU cache for large layout compare payloads."""

from __future__ import annotations

import threading
from collections import OrderedDict
from collections.abc import Callable


class ByteBoundedLruCache[K, V]:
    def __init__(
        self,
        max_bytes: int,
        value_size: Callable[[V], int],
    ) -> None:
        if max_bytes <= 0:
            raise ValueError("max_bytes must be positive")
        self._max_bytes = max_bytes
        self._value_size = value_size
        self._data: OrderedDict[K, V] = OrderedDict()
        self._total_bytes = 0
        self._lock = threading.Lock()

    @property
    def total_bytes(self) -> int:
        with self._lock:
            return self._total_bytes

    def get(self, key: K) -> V | None:
        with self._lock:
            value = self._data.get(key)
            if value is None:
                return None
            self._data.move_to_end(key)
            return value

    def set(self, key: K, value: V, *, max_entry_bytes: int | None = None) -> bool:
        entry_size = self._value_size(value)
        if max_entry_bytes is not None and entry_size > max_entry_bytes:
            return False
        with self._lock:
            if key in self._data:
                self._total_bytes -= self._value_size(self._data[key])
                del self._data[key]
            while self._total_bytes + entry_size > self._max_bytes and self._data:
                _, evicted = self._data.popitem(last=False)
                self._total_bytes -= self._value_size(evicted)
            if entry_size > self._max_bytes:
                return False
            self._data[key] = value
            self._total_bytes += entry_size
            self._data.move_to_end(key)
            return True

    def clear(self) -> None:
        with self._lock:
            self._data.clear()
            self._total_bytes = 0
