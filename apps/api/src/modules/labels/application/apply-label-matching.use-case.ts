// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { TAXONOMY_REPOSITORY, type TaxonomyRepository } from '../../../shared/domain/ports.js';
import { contentMatchesRule, shouldAutoAssignTag, shouldSuggestTag } from '../domain/matching.js';

@Injectable()
export class ApplyLabelMatchingUseCase {
  constructor(@Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository) {}

  async execute(documentId: string, userId: string, content: string): Promise<void> {
    const haystack = `${content}\n`;

    const tags = await this.taxonomy.listTags(userId);
    const assigned = new Set(
      (await this.taxonomy.listTagsForDocument(documentId)).map((t) => t.id)
    );

    for (const tag of tags) {
      if (assigned.has(tag.id)) {
        continue;
      }
      const matches = contentMatchesRule({
        algorithm: tag.matchingAlgorithm,
        pattern: tag.match,
        content: haystack,
      });
      if (!matches) {
        continue;
      }

      if (shouldAutoAssignTag(tag.matchingAlgorithm)) {
        await this.taxonomy.assignTagToDocument(documentId, tag.id);
        assigned.add(tag.id);
        if (!tag.isInbox) {
          await this.taxonomy.clearInboxTagForDocument(documentId, userId);
        }
      } else if (shouldSuggestTag(tag.matchingAlgorithm)) {
        await this.taxonomy.upsertSuggestion(
          documentId,
          tag.id,
          `Schlüsselwort-Treffer (${tag.name})`,
          { source: 'rule' }
        );
      }
    }
  }
}
