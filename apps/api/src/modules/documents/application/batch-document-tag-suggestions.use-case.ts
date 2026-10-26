// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DOCUMENT_TAG_SUGGESTIONS_BATCH_MAX } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { LoadDocumentLabelSuggestionsUseCase } from '../../labels/application/load-document-labels.use-case.js';
import type { TagSuggestionEntity } from '../../taxonomy/domain/taxonomy.entity.js';

@Injectable()
export class BatchDocumentTagSuggestionsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly loadSuggestions: LoadDocumentLabelSuggestionsUseCase
  ) {}

  async execute(
    userId: string,
    documentIds: string[]
  ): Promise<Map<string, TagSuggestionEntity[]>> {
    const capped = [...new Set(documentIds)].slice(0, DOCUMENT_TAG_SUGGESTIONS_BATCH_MAX);
    if (capped.length === 0) {
      return new Map();
    }
    const owned = await this.documents.filterOwnedDocumentIds(userId, capped);
    if (owned.length === 0) {
      return new Map();
    }
    return this.loadSuggestions.executeMany(userId, owned);
  }
}
