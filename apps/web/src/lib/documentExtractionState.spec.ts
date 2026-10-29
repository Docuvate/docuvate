// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { presentExtractionFailure } from './documentExtractionState';

describe('presentExtractionFailure', () => {
  it('maps worker HTTP failures to a user-facing message with technical detail', () => {
    const result = presentExtractionFailure('Worker extraction failed: 500');
    expect(result.userMessage).not.toContain('Worker extraction');
    expect(result.userMessage).not.toContain('500');
    expect(result.technicalDetail).toBe('Worker extraction failed: 500');
  });

  it('returns default copy when reason is empty', () => {
    const result = presentExtractionFailure(null);
    expect(result.technicalDetail).toBeNull();
    expect(result.userMessage.length).toBeGreaterThan(10);
  });

  it('maps extract-deadline timeout to a user-facing message', () => {
    const result = presentExtractionFailure('documents.extractionFailedTimeout');
    expect(result.userMessage).not.toBe('documents.extractionFailedTimeout');
    expect(result.userMessage.toLowerCase()).toMatch(/zeitlimit|time limit/);
    expect(result.technicalDetail).toBeNull();
  });

  it('translates typed failure codes stored as i18n keys', () => {
    const key = 'documents.extractionFailureCode.resource_exhausted';
    const result = presentExtractionFailure(key);
    expect(result.userMessage).not.toBe(key);
    expect(result.technicalDetail).toBeNull();
  });
});
