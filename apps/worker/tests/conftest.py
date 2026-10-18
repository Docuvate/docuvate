# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import pytest

from docuvate_worker.infrastructure.ml.value_types.amount_line_ranker import (
    get_amount_line_ranker,
)
from docuvate_worker.infrastructure.ml.value_types.field_confidence_calibration import (
    get_field_confidence_calibration,
)
from docuvate_worker.infrastructure.ml.value_types.promotion_probability_calibrator import (
    get_promotion_probability_calibrators,
)
from docuvate_worker.infrastructure.extractors.field_extraction_context import (
    clear_passage_vector_cache,
)
from docuvate_worker.infrastructure.ml.value_types.vendor_line_ranker import (
    get_vendor_line_ranker,
)


@pytest.fixture(autouse=True)
def _clear_field_ml_artifact_caches() -> None:
    clear_passage_vector_cache()
    get_vendor_line_ranker.cache_clear()
    get_amount_line_ranker.cache_clear()
    get_field_confidence_calibration.cache_clear()
    get_promotion_probability_calibrators.cache_clear()
