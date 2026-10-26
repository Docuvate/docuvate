// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface FieldExtractionFeedbackCounts {
  corrections: number;
  confirmations: number;
}

export function parseFieldExtractionFeedbackCounts(
  correctionsRecorded: number | undefined,
  confirmationsRecorded: number | undefined
): FieldExtractionFeedbackCounts | null {
  const corrections = correctionsRecorded ?? 0;
  const confirmations = confirmationsRecorded ?? 0;
  if (corrections === 0 && confirmations === 0) {
    return null;
  }
  return { corrections, confirmations };
}

/** Feedback banners must not contradict the dirty state of the corrections form. */
export function showFieldCorrectionFeedbackBanner(
  fieldsDirty: boolean,
  feedback: FieldExtractionFeedbackCounts | null
): boolean {
  if (!feedback || feedback.corrections === 0) {
    return false;
  }
  return !fieldsDirty;
}

export function showFieldConfirmationFeedbackBanner(
  fieldsDirty: boolean,
  feedback: FieldExtractionFeedbackCounts | null
): boolean {
  if (!feedback || feedback.confirmations === 0) {
    return false;
  }
  return !fieldsDirty;
}
