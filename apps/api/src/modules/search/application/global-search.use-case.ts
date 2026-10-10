// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  GlobalSearchGroupDto,
  GlobalSearchQuery,
  GlobalSearchResponseDto,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { EMBEDDING_PORT, type EmbeddingPort } from '../../../shared/domain/ports.js';
import { normalizeSearchText } from '../domain/normalize-search-text.js';
import { parseSearchScope, resolveSearchTypes } from '../domain/parse-search-scope.js';
import { resolveFieldFilters } from '../domain/resolve-field-definition.js';
import { PgGlobalSearchRepository } from '../infrastructure/pg-global-search.repository.js';

const DEFAULT_LIMIT = 8;

@Injectable()
export class GlobalSearchUseCase {
  constructor(
    private readonly searchRepo: PgGlobalSearchRepository,
    @Inject(EMBEDDING_PORT) private readonly embedding: EmbeddingPort
  ) {}

  async execute(userId: string, query: GlobalSearchQuery): Promise<GlobalSearchResponseDto> {
    const parsed = parseSearchScope(query.q);
    const types = resolveSearchTypes(parsed.scopes, query.types);
    const perGroup = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), 20);
    const textQuery =
      parsed.textQuery || (parsed.fieldFilters.length === 0 ? query.q.trim() : '') || '';
    const fieldDefs = await this.searchRepo.listFieldDefinitions(userId);
    const resolvedFieldFilters = resolveFieldFilters(parsed.fieldFilters, fieldDefs);

    const includeDocuments = types.includes('documents');
    const includeFolders = types.includes('folders');
    const includeLabels = types.includes('labels');

    let queryVector: number[] | undefined;
    const embedLegEnabled =
      includeDocuments &&
      textQuery.length >= 3 &&
      process.env.GLOBAL_SEARCH_DISABLE_EMBED !== '1';
    if (embedLegEnabled && (await this.searchRepo.userHasDocumentEmbeddings(userId))) {
      try {
        const { embeddings } = await this.embedding.embedTexts([textQuery]);
        queryVector = embeddings[0];
      } catch {
        /* vector leg optional when worker unavailable */
      }
    }

    const result = await this.searchRepo.search(userId, textQuery, {
      perGroupLimit: perGroup,
      includeDocuments,
      includeFolders,
      includeLabels,
      queryVector,
      embedFullScan: process.env.GLOBAL_SEARCH_EMBED_FULL_SCAN === '1',
      fieldFilters: resolvedFieldFilters,
    });

    const groups: GlobalSearchGroupDto[] = [];

    if (includeDocuments && result.documents.length > 0) {
      const items = result.documents.map((d) => ({
        type: 'document' as const,
        id: d.id,
        title: d.title,
        filename: d.filename,
        snippet: d.snippetText,
        matchedFieldLabel: d.matchedFieldLabel,
        highlightSpans: d.highlightSpans,
        snippetHighlightSpans: d.snippetHighlightSpans,
        labelNames: d.labelNames,
        folderPath: d.folderPath,
        documentDate: d.documentDate,
        updatedAt: d.updatedAt,
        score: d.score,
      }));
      groups.push({
        type: 'documents',
        total: result.documentTotal,
        items,
        showAllHref:
          textQuery && result.documentTotal > items.length && items.length > 0
            ? `/documents?filter=${encodeURIComponent(textQuery)}`
            : null,
      });
    }
    if (includeFolders && result.folders.length > 0) {
      groups.push({
        type: 'folders',
        total: result.folderTotal,
        items: result.folders.map((f) => ({
          type: 'folder' as const,
          id: f.id,
          name: f.name,
          path: f.path,
          documentCount: f.documentCount,
          highlightSpans: f.highlightSpans,
          score: f.score,
        })),
        showAllHref: null,
      });
    }
    if (includeLabels && result.labels.length > 0) {
      groups.push({
        type: 'labels',
        total: result.labelTotal,
        items: result.labels.map((l) => ({
          type: 'label' as const,
          id: l.id,
          name: l.name,
          color: l.color,
          documentCount: l.documentCount,
          highlightSpans: l.highlightSpans,
          score: l.score,
        })),
        showAllHref: null,
      });
    }

    return {
      query: query.q,
      normalizedQuery: normalizeSearchText(textQuery),
      expandedTerms: result.expandedTerms,
      groups,
    };
  }
}
