// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Global coarse learn-then-test target (top-group posterior mass per block). */
export const EMBEDDING_DENSITY_COARSE_TOP_GROUP_TARGET_ID = 'top_group';

/**
 * Minimum unique labeled documents for coarse auto-apply (0.99 CP at δ/10, 25% certification split).
 * Automatic labeling needs about this many labeled documents.
 */
export const EMBEDDING_DENSITY_MIN_UNIQUE_DOCUMENTS_COARSE_READY = 2112;

/**
 * Minimum unique labeled documents per label for fine confirm suggestions (0.95 CP, 25% certification split).
 */
export const EMBEDDING_DENSITY_MIN_UNIQUE_DOCUMENTS_FINE_READY_PER_LABEL = 416;

/** Customer-facing hint (keep in sync with worker calibration.py). */
export const EMBEDDING_DENSITY_READINESS_HINT_EN =
  'Automatic labeling needs about 2112 labeled documents; suggestions start at about 416 per label at the current split.';
