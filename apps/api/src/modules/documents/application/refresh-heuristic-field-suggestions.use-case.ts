// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { dedupeExtractedFields, parseSuggestionStorageKey } from '@docuvate/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { HEURISTIC_FIELD_EXTRACTOR_VERSION } from '../domain/heuristic-field-suggestions-fingerprint.js';
import { mergeExtractionFieldRows } from '../infrastructure/document-extraction.persistence.js';
import { fetchWorkerHeuristicFieldSuggestions } from '../infrastructure/fetch-worker-heuristic-field-suggestions.js';
import { AutoAcceptCalibratedReviewUseCase } from './document-review/auto-accept-calibrated-review.use-case.js';
import { PromoteHighConfidenceExtractionSuggestionsUseCase } from './document-review/promote-extraction-suggestions.use-case.js';
import { stripJunkHeuristicFieldSuggestions } from './document-review/strip-junk-field-suggestions.js';

const HEURISTIC_SEMANTICS = new Set(['vendor', 'amount', 'date']);

@Injectable()
export class RefreshHeuristicFieldSuggestionsUseCase {
  private readonly logger = new Logger(RefreshHeuristicFieldSuggestionsUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly promoteHighConfidenceSuggestions: PromoteHighConfidenceExtractionSuggestionsUseCase,
    private readonly autoAcceptCalibratedReview: AutoAcceptCalibratedReviewUseCase
  ) {}

  async execute(documentId: string, userId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc?.extraction?.text.trim()) {
      return;
    }
    const text = doc.extraction.text.trim();
    const suggestions = await fetchWorkerHeuristicFieldSuggestions(text);
    const existing = doc.extraction.fields;
    const kept = existing.filter((row) => {
      const semantic = parseSuggestionStorageKey(row.key);
      return semantic == null || !HEURISTIC_SEMANTICS.has(semantic);
    });
    const firstLine = text.split('\n').find((line) => line.trim().length > 0) ?? null;
    const merged = dedupeExtractedFields(
      stripJunkHeuristicFieldSuggestions(
        mergeExtractionFieldRows(kept, suggestions),
        { title: doc.title, filename: doc.filename, firstLine }
      )
    );
    await this.documents.updateForUser(documentId, userId, {
      extractionFields: merged,
    });
    await this.documents.setHeuristicFieldExtractorVersion(
      documentId,
      HEURISTIC_FIELD_EXTRACTOR_VERSION
    );
    await this.promoteHighConfidenceSuggestions.execute(documentId, userId);
    await this.autoAcceptCalibratedReview.execute(documentId, userId);
  }

  async executeForUserBatch(userId: string, documentIds: readonly string[]): Promise<void> {
    for (const documentId of documentIds) {
      try {
        await this.execute(documentId, userId);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Heuristic field refresh failed for ${documentId}: ${message}`);
      }
    }
  }
}
