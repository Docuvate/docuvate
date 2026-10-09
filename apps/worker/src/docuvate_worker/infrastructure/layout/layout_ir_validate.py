"""Strict validation for layout IR JSON before domain construction."""

from __future__ import annotations

import math
from typing import Any

from docuvate_worker.domain.layout_ir import (
    FontWeight,
    LayoutIrCellRole,
    LayoutIrVectorKind,
    LayoutIrWidgetKind,
    TextAlign,
)


def _require_key(raw: dict[str, Any], key: str) -> Any:
    if key not in raw:
        raise ValueError(f"Missing required field: {key}")
    return raw[key]


def _finite_float(value: Any, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{field} must be a number")
    out = float(value)
    if not math.isfinite(out):
        raise ValueError(f"{field} must be finite")
    return out


def _optional_finite_float(value: Any, field: str) -> float | None:
    if value is None:
        return None
    return _finite_float(value, field)


def _optional_int(value: Any, field: str) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{field} must be an integer")
    return value


def _rgb_triple(value: Any, field: str) -> tuple[float, float, float]:
    if not isinstance(value, (list, tuple)) or len(value) != 3:
        raise ValueError(f"{field} must be a 3-element array")
    return (
        _finite_float(value[0], f"{field}[0]"),
        _finite_float(value[1], f"{field}[1]"),
        _finite_float(value[2], f"{field}[2]"),
    )


def _matrix_six(value: Any, field: str) -> tuple[float, float, float, float, float, float]:
    if not isinstance(value, (list, tuple)) or len(value) != 6:
        raise ValueError(f"{field} must be a 6-element array")
    return tuple(_finite_float(v, f"{field}[{i}]") for i, v in enumerate(value))


def _weight(raw: str | None) -> FontWeight:
    if raw is None or raw == "normal":
        return FontWeight.NORMAL
    if raw == "bold":
        return FontWeight.BOLD
    raise ValueError("weight must be normal or bold")


def _align(raw: str | None) -> TextAlign:
    if raw in (None, "left"):
        return TextAlign.LEFT
    if raw in ("center", "right", "justify"):
        return TextAlign(raw)
    raise ValueError("align must be left, center, right, or justify")


def _check_mark(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or len(value) != 1:
        raise ValueError("checkMark must be a single character")
    return value


def _vector_kind(raw: Any) -> LayoutIrVectorKind:
    kind = str(raw or "rect")
    try:
        return LayoutIrVectorKind(kind)
    except ValueError:
        raise ValueError("invalid vector kind") from None


def _widget_kind(raw: Any) -> LayoutIrWidgetKind:
    kind = str(raw or "text")
    try:
        return LayoutIrWidgetKind(kind)
    except ValueError:
        raise ValueError("invalid widget kind") from None


def _cell_role(raw: Any) -> LayoutIrCellRole | None:
    if raw is None:
        return None
    try:
        return LayoutIrCellRole(str(raw))
    except ValueError:
        raise ValueError("invalid cellRole") from None
