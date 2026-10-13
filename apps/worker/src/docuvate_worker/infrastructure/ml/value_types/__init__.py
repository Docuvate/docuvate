# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Learned per-value-type character n-gram models (A3 / VGRAM)."""

from docuvate_worker.infrastructure.ml.value_types.model import ValueTypeModelBundle
from docuvate_worker.infrastructure.ml.value_types.registry import get_value_type_models

__all__ = ["ValueTypeModelBundle", "get_value_type_models"]
