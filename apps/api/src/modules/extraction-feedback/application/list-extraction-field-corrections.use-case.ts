// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import {
  EXTRACTION_FIELD_FEEDBACK_REPOSITORY,
  type ExtractionFieldFeedbackRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class ListExtractionFieldCorrectionsUseCase {
  constructor(
    @Inject(EXTRACTION_FIELD_FEEDBACK_REPOSITORY)
    private readonly feedback: ExtractionFieldFeedbackRepository
  ) {}

  execute(userId: string, options?: { limit?: number; afterCreatedAt?: string; afterId?: string }) {
    return this.feedback.listForUser(userId, {
      limit: options?.limit,
      afterCreatedAt: options?.afterCreatedAt ? new Date(options.afterCreatedAt) : undefined,
      afterId: options?.afterId,
    });
  }
}
