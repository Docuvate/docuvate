// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export const RECOGNIZED_FIELD_REEXTRACT_QUEUE_NAME = 'recognized-field-reextract';

export const RECOGNIZED_FIELD_REEXTRACT_BATCH_LIMIT = 2000;

/** Bump when label-field extraction logic changes; stale attempts are re-queued. */
export const RECOGNIZED_FIELD_EXTRACTOR_VERSION = 1;
