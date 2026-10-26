// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import {
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import type { TagSuggestionEntity } from '../../taxonomy/domain/taxonomy.entity.js';
import { filterExclusiveTagSuggestions } from '../domain/filter-exclusive-tag-suggestions.js';
import { isBlockedLabelCandidate } from '../domain/recommendation-blocklist.js';
import { PgLabelCoOccurrenceRepository } from '../infrastructure/pg-label-co-occurrence.repository.js';

function filterSuggestionsForDocument(
  suggestions: TagSuggestionEntity[],
  assignedTagIds: Set<string>,
  blockPhrases: string[],
  blockPatterns: string[],
  exclusivePairs: Awaited<ReturnType<PgLabelCoOccurrenceRepository['listMutuallyExclusiveTagPairs']>>
): TagSuggestionEntity[] {
  const notBlocked = suggestions.filter(
    (suggestion) => !isBlockedLabelCandidate(suggestion.tag.name, blockPhrases, blockPatterns)
  );
  return filterExclusiveTagSuggestions({
    suggestions: notBlocked,
    assignedTagIds,
    exclusivePairs,
  });
}

@Injectable()
export class LoadDocumentLabelSuggestionsUseCase {
  constructor(
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    private readonly coOccurrence: PgLabelCoOccurrenceRepository
  ) {}

  async execute(documentId: string, userId: string): Promise<TagSuggestionEntity[]> {
    const [suggestions, blocklist, patterns, assignedTags, exclusivePairs] = await Promise.all([
      this.taxonomy.listSuggestions(documentId, userId),
      this.labelEmbeddings.listRecommendationBlocklist(userId),
      this.labelEmbeddings.listRecommendationBlocklistPatterns(userId),
      this.taxonomy.listTagsForDocument(documentId),
      this.coOccurrence.listMutuallyExclusiveTagPairs(userId),
    ]);
    const blockPhrases = blocklist.map((entry) => entry.phrase);
    const blockPatterns = patterns.map((entry) => entry.pattern);
    const assignedIds = new Set(assignedTags.map((tag) => tag.id));
    return filterSuggestionsForDocument(
      suggestions,
      assignedIds,
      blockPhrases,
      blockPatterns,
      exclusivePairs
    );
  }

  async executeMany(
    userId: string,
    documentIds: string[]
  ): Promise<Map<string, TagSuggestionEntity[]>> {
    const uniqueIds = [...new Set(documentIds)];
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const [suggestionsByDoc, blocklist, patterns, assignedByDoc, exclusivePairs] =
      await Promise.all([
        this.taxonomy.listSuggestionsForDocuments(uniqueIds, userId),
        this.labelEmbeddings.listRecommendationBlocklist(userId),
        this.labelEmbeddings.listRecommendationBlocklistPatterns(userId),
        this.taxonomy.listTagsForDocuments(uniqueIds),
        this.coOccurrence.listMutuallyExclusiveTagPairs(userId),
      ]);
    const blockPhrases = blocklist.map((entry) => entry.phrase);
    const blockPatterns = patterns.map((entry) => entry.pattern);
    const result = new Map<string, TagSuggestionEntity[]>();
    for (const documentId of uniqueIds) {
      const suggestions = suggestionsByDoc.get(documentId) ?? [];
      const assignedIds = new Set((assignedByDoc.get(documentId) ?? []).map((tag) => tag.id));
      result.set(
        documentId,
        filterSuggestionsForDocument(
          suggestions,
          assignedIds,
          blockPhrases,
          blockPatterns,
          exclusivePairs
        )
      );
    }
    return result;
  }
}
