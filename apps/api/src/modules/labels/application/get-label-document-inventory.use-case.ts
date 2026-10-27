// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelDocumentInventoryQuery,
  LabelDocumentInventoryResponseDto,
  LabelDocumentInventorySummaryResponseDto,
} from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { clampCursorListLimit } from '../../../shared/infrastructure/pagination/clamp-cursor-list-limit.js';
import { PgLabelDocumentInventoryRepository } from '../infrastructure/pg-label-document-inventory.repository.js';

@Injectable()
export class GetLabelDocumentInventoryUseCase {
  constructor(private readonly inventory: PgLabelDocumentInventoryRepository) {}

  async executeSummary(userId: string): Promise<LabelDocumentInventorySummaryResponseDto> {
    return this.inventory.loadSummary(userId);
  }

  async execute(
    userId: string,
    query: LabelDocumentInventoryQuery = {}
  ): Promise<LabelDocumentInventoryResponseDto> {
    const limit = clampCursorListLimit(query.limit);
    const summary = query.cursor ? null : await this.inventory.loadSummary(userId);
    const page = await this.inventory.listDocumentsPage(userId, limit, query.cursor);

    const summaryFields = summary ?? {
      inventory: { total: 0, labeled: 0, unlabeled: 0 },
      documentCountByTagId: {},
    };

    return {
      ...summaryFields,
      items: page.documents,
      documents: page.documents,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      total: page.total,
    };
  }
}
