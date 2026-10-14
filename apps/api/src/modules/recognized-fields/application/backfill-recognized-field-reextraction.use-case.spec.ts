// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import { BackfillRecognizedFieldReextractionUseCase } from './backfill-recognized-field-reextraction.use-case.js';

describe('BackfillRecognizedFieldReextractionUseCase', () => {
  it('enqueues only document/field pairs without attempt rows', async () => {
    const field = {
      id: 'field-1',
      key: 'gross',
      label: 'Brutto',
      sortOrder: 0,
      fieldType: 'currency' as const,
      extractForAllDocuments: true,
      gateLabelIds: [],
      gateLabelMatch: 'any' as const,
      minLabelConfidence: null,
      confidenceGateEnabled: null,
    };
    const fields = {
      listForUser: vi.fn().mockResolvedValue([field]),
    };
    const prefs = {
      getForUser: vi.fn().mockResolvedValue({
        fieldExtractionConfidenceGateEnabled: true,
        labelFieldConfidenceThreshold: 0.8,
      }),
    };
    const attempts = {
      listDocumentIdsMissingAttempts: vi.fn().mockResolvedValue(['doc-1', 'doc-2']),
      upsertMany: vi.fn(),
    };
    const queue = { enqueue: vi.fn() };
    const useCase = new BackfillRecognizedFieldReextractionUseCase(
      fields,
      prefs,
      attempts,
      queue
    );

    await useCase.executeForUser('user-1');

    expect(attempts.upsertMany).toHaveBeenCalledTimes(2); // eslint-disable-line @typescript-eslint/unbound-method -- vitest mock
    expect(queue.enqueue).toHaveBeenCalledTimes(2); // eslint-disable-line @typescript-eslint/unbound-method -- vitest mock
  });
});
