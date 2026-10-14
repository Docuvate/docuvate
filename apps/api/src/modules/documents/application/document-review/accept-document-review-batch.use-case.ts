// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AcceptDocumentReviewBatchResponseDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import type { AuthorizationSubject } from '../../../../shared/domain/authorization.js';
import { PgDocumentReviewQueueRepository } from '../../infrastructure/pg-document-review-queue.repository.js';
import { AcceptDocumentReviewUseCase } from './accept-document-review.use-case.js';

@Injectable()
export class AcceptDocumentReviewBatchUseCase {
  constructor(
    private readonly reviewQueueRepo: PgDocumentReviewQueueRepository,
    private readonly acceptReview: AcceptDocumentReviewUseCase
  ) {}

  async execute(
    userId: string,
    subject: AuthorizationSubject,
    minConfidence: number
  ): Promise<AcceptDocumentReviewBatchResponseDto> {
    const { rows } = await this.reviewQueueRepo.listPendingDocumentIds(userId, 200, 0);
    let documentsProcessed = 0;
    let acceptedLabels = 0;
    let acceptedFields = 0;
    for (const row of rows) {
      const result = await this.acceptReview.execute(row.id, userId, subject, { minConfidence });
      if (result.acceptedLabels > 0 || result.acceptedFields > 0) {
        documentsProcessed += 1;
        acceptedLabels += result.acceptedLabels;
        acceptedFields += result.acceptedFields;
      }
    }
    return { documentsProcessed, acceptedLabels, acceptedFields };
  }
}
