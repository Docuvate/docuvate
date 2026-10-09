// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import {
  LABEL_EMBEDDING_REPOSITORY,
  TAXONOMY_REPOSITORY,
  type LabelEmbeddingRepository,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import type { TagSuggestionEntity } from '../../taxonomy/domain/taxonomy.entity.js';
import { isBlockedLabelCandidate } from '../domain/recommendation-blocklist.js';

@Injectable()
export class LoadDocumentLabelSuggestionsUseCase {
  constructor(
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository
  ) {}

  async execute(documentId: string, userId: string): Promise<TagSuggestionEntity[]> {
    const [suggestions, blocklist, patterns] = await Promise.all([
      this.taxonomy.listSuggestions(documentId, userId),
      this.labelEmbeddings.listRecommendationBlocklist(userId),
      this.labelEmbeddings.listRecommendationBlocklistPatterns(userId),
    ]);
    const blockPhrases = blocklist.map((entry) => entry.phrase);
    const blockPatterns = patterns.map((entry) => entry.pattern);
    return suggestions.filter(
      (suggestion) => !isBlockedLabelCandidate(suggestion.tag.name, blockPhrases, blockPatterns)
    );
  }
}
