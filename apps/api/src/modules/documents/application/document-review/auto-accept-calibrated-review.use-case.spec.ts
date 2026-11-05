// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { AcceptDocumentReviewUseCase } from './accept-document-review.use-case.js';
import { AutoAcceptCalibratedReviewUseCase } from './auto-accept-calibrated-review.use-case.js';

const acceptExecute = vi.fn().mockResolvedValue({
  documentId: 'doc-1',
  acceptedLabels: 0,
  acceptedFields: 0,
});

vi.mock('./accept-document-review.use-case.js', () => ({
  AcceptDocumentReviewUseCase: class AcceptDocumentReviewUseCase {
    execute = acceptExecute;
  },
}));

describe('AutoAcceptCalibratedReviewUseCase', () => {
  it('accepts without marking values as confirmed by a person', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AcceptDocumentReviewUseCase,
        {
          provide: AutoAcceptCalibratedReviewUseCase,
          inject: [AcceptDocumentReviewUseCase],
          useFactory: (acceptReview: AcceptDocumentReviewUseCase) =>
            new AutoAcceptCalibratedReviewUseCase(acceptReview),
        },
      ],
    }).compile();
    const useCase = moduleRef.get(AutoAcceptCalibratedReviewUseCase);

    await useCase.execute('doc-1', 'user-1');

    expect(acceptExecute).toHaveBeenCalledTimes(1);
    expect(acceptExecute.mock.calls[0]?.[3]).toEqual({
      minConfidence: useCase.resolveAutoAcceptMinConfidence(),
      confirmedByUser: false,
    });
  });
});
