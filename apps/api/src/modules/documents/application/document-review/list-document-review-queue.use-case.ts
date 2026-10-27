// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentReviewQueueItemDto,
  DocumentReviewQueueResponseDto,
  DocumentReviewQueueSummaryDto,
} from '@docuvate/contracts';
import { partitionRecognizedAndHeuristicSuggestions } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { DocumentAuthorizationService } from '../../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../../shared/domain/authorization.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  DUPLICATE_STACK_REPOSITORY,
  type DuplicateStackRepository,
} from '../../../../shared/domain/ports.js';
import { PG_POOL } from '../../../../shared/infrastructure/database/tokens.js';
import { LoadDocumentLabelSuggestionsUseCase } from '../../../labels/application/load-document-labels.use-case.js';
import { calibratedLabelSuggestionConfidence } from '../../../labels/domain/label-suggestion-calibrated-confidence.js';
import { PgEmbeddingDensityRepository } from '../../../labels/infrastructure/pg-embedding-density.repository.js';
import { ListRecognizedFieldsUseCase } from '../../../recognized-fields/application/recognized-field.use-cases.js';
import { loadFieldDefinitionLookup } from '../../../search/infrastructure/document-field-value-index.js';
import { toTagSuggestionDto } from '../../../taxonomy/presentation/taxonomy.mapper.js';
import { PgDocumentReviewQueueRepository } from '../../infrastructure/pg-document-review-queue.repository.js';
import {
  buildReviewFieldSuggestions,
  isoDateFromFieldValue,
} from './document-review-field-display.js';
import { PromoteHighConfidenceExtractionSuggestionsUseCase } from './promote-extraction-suggestions.use-case.js';

@Injectable()
export class ListDocumentReviewQueueUseCase {
  constructor(
    private readonly reviewQueueRepo: PgDocumentReviewQueueRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository,
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly loadSuggestions: LoadDocumentLabelSuggestionsUseCase,
    private readonly listRecognizedFields: ListRecognizedFieldsUseCase,
    private readonly documentAuthz: DocumentAuthorizationService,
    private readonly promoteHighConfidence: PromoteHighConfidenceExtractionSuggestionsUseCase,
    private readonly densityRepo: PgEmbeddingDensityRepository
  ) {}

  async summary(userId: string, subject: AuthorizationSubject): Promise<DocumentReviewQueueSummaryDto> {
    await this.documentAuthz.assertCollection(subject, 'document:list');
    const pendingCount = await this.reviewQueueRepo.countPendingDocuments(userId);
    return { pendingCount };
  }

  async execute(
    userId: string,
    subject: AuthorizationSubject,
    options: { limit: number; cursor?: string } = { limit: 50 }
  ): Promise<DocumentReviewQueueResponseDto> {
    await this.documentAuthz.assertCollection(subject, 'document:list');
    const { rows, total, hasMore, nextCursor } = await this.reviewQueueRepo.listPendingDocumentPage(
      userId,
      options.limit,
      options.cursor
    );
    const catalog = await this.listRecognizedFields.execute(userId);
    const catalogKeys: ReadonlySet<string> = new Set(
      catalog.map((def: { key: string }) => def.key)
    );
    const fieldDefinitions = await loadFieldDefinitionLookup(this.pool, userId);
    const fineThresholds = await this.densityRepo.loadFineConfirmThresholdMap(userId);

    const items: DocumentReviewQueueItemDto[] = [];
    for (const row of rows) {
      await this.promoteHighConfidence.execute(row.id, userId);
      const entity = await this.documents.findByIdForUser(row.id, userId);
      if (!entity) {
        continue;
      }
      await this.documentAuthz.assert(subject, 'document:read', entity);
      const tagSuggestions = await this.loadSuggestions.execute(row.id, userId);
      const assignedIds = new Set(entity.tags.map((tag) => tag.id));
      const openLabelSuggestions = tagSuggestions.filter((s) => !assignedIds.has(s.tag.id));
      const rankedScores = openLabelSuggestions.map((s) => ({
        tagId: s.tag.id,
        rawConfidence: s.confidence ?? 0,
      }));
      const fields = entity.extraction?.fields ?? [];
      const extractedText = entity.extraction?.text ?? '';
      const firstLine =
        extractedText.split('\n').find((line) => line.trim().length > 0) ?? null;
      const fieldSuggestions = buildReviewFieldSuggestions(
        fields,
        catalogKeys,
        fieldDefinitions,
        {
          title: entity.title,
          filename: entity.filename,
          firstLine,
        }
      );
      const stackSummaries = await this.stacks.summariesForPrimaryDocuments(userId, [row.id]);
      const duplicateStack = stackSummaries.get(row.id) ?? null;

      const { suggestions: heuristicOnly } = partitionRecognizedAndHeuristicSuggestions(
        fields,
        catalogKeys
      );
      let suggestedDocumentDate: string | null = null;
      if (!entity.documentDate) {
        for (const suggestion of heuristicOnly) {
          if (suggestion.key !== 'date') {
            continue;
          }
          const iso = isoDateFromFieldValue(suggestion.value);
          if (iso) {
            suggestedDocumentDate = iso;
            break;
          }
        }
      }

      const hasDuplicateReview = duplicateStack?.pendingReview === true;
      if (
        openLabelSuggestions.length === 0 &&
        fieldSuggestions.length === 0 &&
        !hasDuplicateReview
      ) {
        continue;
      }

      items.push({
        documentId: entity.id,
        title: entity.title,
        filename: entity.filename,
        documentDate: entity.documentDate
          ? entity.documentDate.toISOString().slice(0, 10)
          : null,
        suggestedDocumentDate,
        uploadDate: entity.createdAt.toISOString(),
        labelSuggestions: openLabelSuggestions.map((s) => {
          const dto = toTagSuggestionDto(s);
          const raw = s.confidence ?? 0;
          return {
            ...dto,
            confidence: calibratedLabelSuggestionConfidence({
              tagId: s.tag.id,
              rawConfidence: raw,
              ranked: rankedScores,
              fineThresholds,
            }),
          };
        }),
        fieldSuggestions,
        duplicateStack,
      });
    }

    return { items, hasMore, nextCursor, total };
  }
}
