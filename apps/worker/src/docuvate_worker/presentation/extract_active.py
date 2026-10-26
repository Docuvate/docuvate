# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Tracks the in-flight pooled extract child so HTTP disconnect can cancel work."""

from __future__ import annotations

import threading
from contextvars import ContextVar
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from docuvate_worker.presentation.extract_subprocess_pool import _PooledExtractChild


@dataclass
class ActiveExtractHandle:
    cancel_event: threading.Event
    child: _PooledExtractChild | None = None


_active: ContextVar[ActiveExtractHandle | None] = ContextVar("docuvate_active_extract", default=None)


def bind_active_extract(handle: ActiveExtractHandle) -> None:
    _active.set(handle)


def clear_active_extract() -> None:
    _active.set(None)


def cancel_active_extract() -> bool:
    handle = _active.get()
    if handle is None:
        return False
    handle.cancel_event.set()
    if handle.child is not None:
        handle.child.request_cancel()
    return True


def attach_pool_child_to_active(child: _PooledExtractChild) -> None:
    handle = _active.get()
    if handle is not None:
        handle.child = child
