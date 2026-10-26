// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { formatDocumentDatePreview } from './format-document-date-preview.js';

describe('formatDocumentDatePreview', () => {
  it('returns ISO date for valid values', () => {
    expect(formatDocumentDatePreview(new Date('2026-03-15T12:00:00.000Z'))).toBe('2026-03-15');
  });

  it('returns null for invalid dates', () => {
    expect(formatDocumentDatePreview(new Date('not-a-date'))).toBeNull();
  });
});
