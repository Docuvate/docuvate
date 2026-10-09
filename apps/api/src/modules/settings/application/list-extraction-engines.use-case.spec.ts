// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { ListExtractionEnginesUseCase } from './settings.use-cases.js';
import type { ExtractionPort } from '../../../shared/domain/ports.js';

describe('ListExtractionEnginesUseCase', () => {
  it('returns static fallback when worker engines list fails', async () => {
    const extraction: ExtractionPort = {
      listEngines: async () => {
        throw new Error('Worker engines list failed: 503');
      },
      extract: async () => {
        throw new Error('not used');
      },
      compare: async () => {
        throw new Error('not used');
      },
    };
    const useCase = new ListExtractionEnginesUseCase(extraction);
    const engines = await useCase.execute();
    expect(engines.length).toBeGreaterThan(0);
    expect(engines.some((e) => e.id === 'pipeline')).toBe(true);
    expect(engines.every((e) => e.available === false)).toBe(true);
  });
});
