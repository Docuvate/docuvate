// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagCustomFieldSuggestionDto } from '@docuvate/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { HttpCeMlAdapter } from '../infrastructure/http-ce-ml.adapter.js';

const MAX_DOCS_FOR_DISCOVERY = 24;

@Injectable()
export class SuggestTagCustomFieldsUseCase {
  private readonly logger = new Logger(SuggestTagCustomFieldsUseCase.name);

  constructor(
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly ceMl: HttpCeMlAdapter
  ) {}

  async execute(tagId: string, userId: string): Promise<TagCustomFieldSuggestionDto[]> {
    const tag = await this.taxonomy.findTagByIdForUser(tagId, userId);
    if (!tag || tag.isInbox) {
      return [];
    }
    const ready = await this.documents.listForUser(userId, { status: 'ready' });
    const tagged = ready.filter((doc) => doc.tags.some((t) => t.id === tagId && !t.isInbox));
    if (tagged.length === 0) {
      return [];
    }
    const sample = tagged.slice(0, MAX_DOCS_FOR_DISCOVERY);
    const documents = sample
      .map((doc) => {
        const blocks = doc.extraction?.blocks ?? [];
        if (blocks.length < 2) {
          return null;
        }
        return {
          documentId: doc.id,
          blocks: blocks.map((block) => ({
            text: block.text,
            page: block.page,
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
          })),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
    if (documents.length === 0) {
      return [];
    }
    const labelConfidence = Math.min(1, 0.85 + Math.min(tagged.length, 10) * 0.015);
    try {
      const fields = await this.ceMl.discoverConditionalFields({
        labelConfidence,
        documents,
      });
      return fields.map((field) => ({
        key: field.fieldKey,
        label: field.displayName,
        confidence: field.confidence,
        kind: field.kind,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`CE field discovery skipped for tag ${tagId}: ${message}`);
      return [];
    }
  }
}
