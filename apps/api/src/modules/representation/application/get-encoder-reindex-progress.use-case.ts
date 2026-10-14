// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { EncoderReindexProgressDto } from '../../../shared/presentation/dtos/encoder-reindex.dto.js';
import { PgEncoderReindexRepository } from '../infrastructure/pg-encoder-reindex.repository.js';

@Injectable()
export class GetEncoderReindexProgressUseCase {
  constructor(private readonly repository: PgEncoderReindexRepository) {}

  async execute(tenantId: string): Promise<EncoderReindexProgressDto> {
    const progress = await this.repository.progressForTenant(tenantId);
    const completed = Math.max(0, progress.readyDocumentCount - progress.staleCount);
    return {
      targetEncoderId: progress.targetEncoderId,
      targetEncoderRevision: progress.targetEncoderRevision,
      progressProcessed: completed,
      progressTotal: progress.readyDocumentCount,
      progressPending: progress.staleCount,
    };
  }
}
