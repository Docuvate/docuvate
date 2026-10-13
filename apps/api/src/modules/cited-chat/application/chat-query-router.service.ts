// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { EMBEDDING_PORT, type EmbeddingPort } from '../../../shared/domain/ports.js';
import { classifyChatRouteIntent } from '../domain/chat-intent-prototypes.schema.js';
import { outOfScopeReply, smallTalkReply } from '../domain/chat-smalltalk-reply.js';
import { resolveFollowUpQuery } from '../domain/resolve-follow-up-query.js';
import { ChatLibraryStatsService } from './chat-library-stats.service.js';

export type ChatQueryRouteResult =
  | { kind: 'document_qa'; resolvedQuery: string }
  | { kind: 'answered'; content: string };

@Injectable()
export class ChatQueryRouterService {
  constructor(
    @Inject(EMBEDDING_PORT) private readonly embedding: EmbeddingPort,
    private readonly libraryStats: ChatLibraryStatsService
  ) {}

  async route(input: {
    userId: string;
    userMessage: string;
    priorUserMessage: string | null;
    scope: 'document' | 'library';
    locale: 'de' | 'en';
    cloudLlm?: {
      baseUrl?: string | null;
      apiKey?: string | null;
      model?: string | null;
    };
  }): Promise<ChatQueryRouteResult> {
    const texts = [input.userMessage];
    if (input.priorUserMessage) {
      texts.push(input.priorUserMessage);
    }
    const { embeddings } = await this.embedding.embedTexts(texts, { inputType: 'query' });
    const currentVec = embeddings[0] ?? [];
    const priorVec = input.priorUserMessage ? embeddings[1] ?? null : null;

    const resolvedQuery = resolveFollowUpQuery(input.userMessage, input.priorUserMessage, {
      current: currentVec,
      prior: priorVec,
    });

    let routeVector = currentVec;
    if (resolvedQuery !== input.userMessage.trim()) {
      const resolvedEmbed = await this.embedding.embedTexts([resolvedQuery], { inputType: 'query' });
      routeVector = resolvedEmbed.embeddings[0] ?? currentVec;
    }

    const intent = classifyChatRouteIntent(routeVector);

    if (intent === 'smalltalk') {
      return { kind: 'answered', content: smallTalkReply(input.locale) };
    }
    if (intent === 'out_of_scope') {
      return { kind: 'answered', content: outOfScopeReply(input.locale) };
    }
    if (intent === 'stats' && input.scope === 'library') {
      const statsAnswer = await this.libraryStats.tryAnswer(
        input.userId,
        resolvedQuery,
        input.locale,
        input.cloudLlm
      );
      if (statsAnswer) {
        return { kind: 'answered', content: statsAnswer };
      }
    }

    return { kind: 'document_qa', resolvedQuery };
  }
}
