# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.domain.exact_fact_index.build import build_exact_fact_index
from docuvate_worker.domain.exact_fact_index.types import ExtractedFact, FactIndexBuildResult

__all__ = ["ExtractedFact", "FactIndexBuildResult", "build_exact_fact_index"]
