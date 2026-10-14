# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Template-subtracted duplicate scoring (residual shingles + value fingerprint)."""

from docuvate_worker.domain.smart_duplicates.config import SmartDuplicateConfig
from docuvate_worker.domain.smart_duplicates.detect import (
    SmartDuplicateDocument,
    score_smart_duplicate_candidates,
)

__all__ = [
    'SmartDuplicateConfig',
    'SmartDuplicateDocument',
    'score_smart_duplicate_candidates',
]
