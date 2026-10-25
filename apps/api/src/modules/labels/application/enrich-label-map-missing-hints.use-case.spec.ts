// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelMapPointDto } from '@docuvate/contracts';
import { describe, expect, it, vi } from 'vitest';

import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import type { MissingLabelHintPort } from '../domain/ce-label-propagation.port.js';
import { EnrichLabelMapMissingHintsUseCase } from './enrich-label-map-missing-hints.use-case.js';

describe('EnrichLabelMapMissingHintsUseCase', () => {
  it('marks document points when worker reports show=true', async () => {
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-1',
        extraction: {
          text: 'text',
          fields: [],
          blocks: [
            { text: 'Alpha', page: 1, x: 0, y: 0, width: 0.2, height: 0.1 },
            { text: 'Beta', page: 1, x: 0.3, y: 0, width: 0.2, height: 0.1 },
          ],
        },
      }),
    });
    const ceMl: MissingLabelHintPort = {
      scoreMissingLabelHint: vi.fn().mockResolvedValue({ score: 0.9, show: true }),
    };
    const useCase = new EnrichLabelMapMissingHintsUseCase(documents, ceMl);
    const points: LabelMapPointDto[] = [
      {
        id: 'doc:doc-1',
        kind: 'document',
        documentId: 'doc-1',
        x: 0.1,
        y: 0.2,
        label: 'Doc',
        tagIds: ['tag-a'],
        coverageStatus: 'unexplained',
        coverageScore: 0.4,
      },
    ];
    const result = await useCase.execute('user-1', points, [
      {
        documentId: 'doc-1',
        documentIndex: 0,
        nonInboxTagIds: ['tag-a'],
        text: 'title',
        embedding: [1, 0],
      },
      {
        documentId: 'doc-2',
        documentIndex: 1,
        nonInboxTagIds: ['tag-a'],
        text: 'gehaltsabrechnung entgelt brutto',
        embedding: [0.9, 0.1],
      },
    ]);
    expect(result.labelMissingHintCount).toBe(1);
    expect(result.points[0]?.labelMissingHint).toBe(true);
  });
});
