// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { normalizeExtractionSurfaceText } from './normalize-extraction-surface-text.js';

describe('normalizeExtractionSurfaceText', () => {
  it('strips soft hyphens for chunk indexing text only', () => {
    const body = 'Die Miete ist bis zum 3.\u00ad Werktag des Monats fällig.';
    const normalized = normalizeExtractionSurfaceText(body);
    expect(normalized).not.toContain('\u00ad');
  });

});
