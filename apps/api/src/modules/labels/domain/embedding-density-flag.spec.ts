// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { embeddingDensityGloballyEnabled } from './embedding-density-flag.js';

describe('embeddingDensityGloballyEnabled', () => {
  const prev = process.env['EMBEDDING_DENSITY_SUGGESTIONS_ENABLED'];

  afterEach(() => {
    if (prev === undefined) {
      delete process.env['EMBEDDING_DENSITY_SUGGESTIONS_ENABLED'];
    } else {
      process.env['EMBEDDING_DENSITY_SUGGESTIONS_ENABLED'] = prev;
    }
  });

  it('defaults to on unless explicitly set to false', () => {
    delete process.env['EMBEDDING_DENSITY_SUGGESTIONS_ENABLED'];
    expect(embeddingDensityGloballyEnabled()).toBe(true);
    process.env['EMBEDDING_DENSITY_SUGGESTIONS_ENABLED'] = 'false';
    expect(embeddingDensityGloballyEnabled()).toBe(false);
    process.env['EMBEDDING_DENSITY_SUGGESTIONS_ENABLED'] = 'true';
    expect(embeddingDensityGloballyEnabled()).toBe(true);
  });
});
