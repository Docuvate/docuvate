// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { ExtractionPort } from '../../../shared/domain/ports.js';
import { ListExtractionEnginesUseCase } from './settings.use-cases.js';

describe('ListExtractionEnginesUseCase', () => {
  it('returns static fallback when worker engines list fails', async () => {
    const extraction: ExtractionPort = {
      listEngines: () => Promise.reject(new Error('Worker engines list failed: 503')),
      extract: () => Promise.reject(new Error('not used')),
      compare: () => Promise.reject(new Error('not used')),
    };
    const useCase = new ListExtractionEnginesUseCase(extraction);
    const engines = await useCase.execute();
    expect(engines.length).toBeGreaterThan(0);
    expect(engines.some((e) => e.id === 'pipeline')).toBe(true);
    expect(engines.every((e) => e.available === false)).toBe(true);
  });
});
