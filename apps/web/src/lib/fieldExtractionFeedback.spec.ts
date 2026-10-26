// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  parseFieldExtractionFeedbackCounts,
  showFieldConfirmationFeedbackBanner,
  showFieldCorrectionFeedbackBanner,
} from './fieldExtractionFeedback';

describe('fieldExtractionFeedback', () => {
  it('returns null when nothing was recorded', () => {
    expect(parseFieldExtractionFeedbackCounts(0, 0)).toBeNull();
    expect(parseFieldExtractionFeedbackCounts(undefined, undefined)).toBeNull();
  });

  it('never shows correction feedback while the form is dirty', () => {
    const feedback = { corrections: 2, confirmations: 0 };
    expect(showFieldCorrectionFeedbackBanner(true, feedback)).toBe(false);
    expect(showFieldCorrectionFeedbackBanner(false, feedback)).toBe(true);
  });

  it('shows confirmation feedback only when clean and confirmations exist', () => {
    const feedback = { corrections: 0, confirmations: 2 };
    expect(showFieldConfirmationFeedbackBanner(true, feedback)).toBe(false);
    expect(showFieldConfirmationFeedbackBanner(false, feedback)).toBe(true);
    expect(showFieldConfirmationFeedbackBanner(false, { corrections: 1, confirmations: 1 })).toBe(
      true
    );
  });
});
