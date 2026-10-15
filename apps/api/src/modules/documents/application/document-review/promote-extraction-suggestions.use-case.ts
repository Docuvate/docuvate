// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  dedupeExtractedFields,
  parseSuggestionStorageKey,
  semanticFieldKey,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../../shared/domain/ports.js';
import { autoPromoteMinConfidenceForField } from '../../domain/value-type-field-confidence.js';
import { isoDateFromFieldValue } from './document-review-field-display.js';

@Injectable()
export class PromoteHighConfidenceExtractionSuggestionsUseCase {
  constructor(@Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository) {}

  async execute(documentId: string, userId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc?.extraction?.fields) {
      return;
    }
    let documentDate = doc.documentDate ?? null;
    const working = [...doc.extraction.fields];
    let changed = false;

    for (const field of doc.extraction.fields) {
      const suggestionSemantic = parseSuggestionStorageKey(field.key);
      if (!suggestionSemantic) {
        continue;
      }
      const confidence = field.confidence ?? 0;
      const minConfidence = autoPromoteMinConfidenceForField(suggestionSemantic);
      if (confidence < minConfidence) {
        continue;
      }
      const value = field.value.trim();
      if (!value) {
        continue;
      }
      if (working.some((row) => semanticFieldKey(row) === suggestionSemantic && row.value.trim())) {
        continue;
      }
      const withoutSuggestion = working.filter(
        (row) => parseSuggestionStorageKey(row.key) !== suggestionSemantic
      );
      withoutSuggestion.push({ key: suggestionSemantic, value, confidence });
      working.length = 0;
      working.push(...withoutSuggestion);
      changed = true;
      if (suggestionSemantic === 'date' && !documentDate) {
        const iso = isoDateFromFieldValue(value);
        if (iso) {
          documentDate = new Date(`${iso}T12:00:00.000Z`);
        }
      }
    }

    if (!changed) {
      return;
    }
    await this.documents.updateForUser(documentId, userId, {
      extractionFields: dedupeExtractedFields(working),
      ...(documentDate ? { documentDate } : {}),
    });
  }
}
