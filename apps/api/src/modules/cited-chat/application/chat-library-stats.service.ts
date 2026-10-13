// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { EMBEDDING_PORT, type EmbeddingPort } from '../../../shared/domain/ports.js';
import { classifyStatsOperation } from '../domain/chat-intent-prototypes.schema.js';
import { formatStatsAnswer } from '../domain/format-stats-answer.js';
import { pickBestTag } from '../domain/pick-tag-by-embedding.js';
import { PgChatLibraryStatsRepository } from '../infrastructure/pg-chat-library-stats.repository.js';
import { phraseLibraryStatsWithLlm } from './cited-chat-ollama.js';

const TAG_MIN_SCORE = 0.68;

@Injectable()
export class ChatLibraryStatsService {
  constructor(
    @Inject(EMBEDDING_PORT) private readonly embedding: EmbeddingPort,
    private readonly statsRepo: PgChatLibraryStatsRepository
  ) {}

  async tryAnswer(
    userId: string,
    resolvedQuery: string,
    locale: 'de' | 'en',
    cloudLlm?: {
      baseUrl?: string | null;
      apiKey?: string | null;
      model?: string | null;
    }
  ): Promise<string | null> {
    const { embeddings } = await this.embedding.embedTexts([resolvedQuery], { inputType: 'query' });
    const queryVector = embeddings[0] ?? [];
    if (queryVector.length === 0) {
      return null;
    }

    const operation = classifyStatsOperation(queryVector);
    const tags = await this.statsRepo.listUserTags(userId);
    if (tags.length === 0 && operation !== 'count_total' && operation !== 'count_ready') {
      return locale === 'en'
        ? 'Your library has no labels yet, so I cannot filter by label.'
        : 'Es sind noch keine Labels vorhanden; eine Filterung nach Label ist nicht möglich.';
    }

    let labelTagId: string | null = null;
    let labelName: string | null = null;
    if (operation === 'count_by_label' || operation === 'list_by_label') {
      const tagTexts = tags.map((t) => t.name);
      const tagEmbeds = await this.embedding.embedTexts(tagTexts, { inputType: 'passage' });
      const candidates = tags.map((tag, i) => ({
        id: tag.id,
        name: tag.name,
        vector: tagEmbeds.embeddings[i] ?? [],
      }));
      const picked = pickBestTag(queryVector, candidates, TAG_MIN_SCORE);
      if (!picked) {
        const suggestions = tags.slice(0, 3).map((t) => t.name);
        return locale === 'en'
          ? `I am not sure which label you mean. Examples: ${suggestions.join(', ')}.`
          : `Welches Label meinen Sie? Beispiele: ${suggestions.join(', ')}.`;
      }
      labelTagId = picked.id;
      labelName = picked.name;
    }

    const result = await this.statsRepo.resolveStatsQuery(userId, operation, labelTagId);
    const fallback = formatStatsAnswer({
      locale,
      operation,
      labelName,
      count: result.count,
      documents: result.documents,
    });
    const phrased = await phraseLibraryStatsWithLlm({
      locale,
      userQuestion: resolvedQuery,
      statsPayload: {
        operation,
        labelName,
        count: result.count,
        documents: result.documents.map((d) => ({
          id: d.id,
          title: d.title,
          filename: d.filename,
        })),
      },
      cloudBaseUrl: cloudLlm?.baseUrl,
      cloudApiKey: cloudLlm?.apiKey,
      cloudModel: cloudLlm?.model,
    });
    return phrased ?? fallback;
  }
}
