import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ExtractionBlock } from '@docuvate/contracts';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  EMBEDDING_PORT,
  type DocumentChatThreadRepository,
  type EmbeddingPort,
} from '../../../shared/domain/ports.js';
import {
  CITED_CHAT_ABSTENTION_DE,
  RAG_RERANK_TOP_K,
  ragFusionGateThreshold,
  ragRerankerGateThreshold,
} from '../domain/cited-chat-constants.js';
import {
  findQuoteInChunk,
  passesFusionGate,
  passesRerankerGate,
} from '../domain/verify-citation-quote.js';
import { PgCitedChatRetrievalRepository } from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import { fetchWorkerRagRerank } from '../infrastructure/fetch-worker-rag-rerank.js';
import { PgChatMessageCitationsRepository } from '../infrastructure/pg-chat-message-citations.repository.js';
import {
  buildCitedChatSystemPrompt,
  requestCitedAnswerFromOllama,
} from './cited-chat-ollama.js';
import { sanitizeChatThreadDocumentIds } from '../../documents/domain/chat-thread-document-ids.js';

const CONTENT_FLUSH_MS = 250;

export interface CitedChatGenerationInput {
  messageId: string;
  threadId: string;
  userId: string;
  userMessage: string;
  documentIds: string[];
  scope: 'document' | 'library';
}

export interface CitedChatGenerationResult {
  content: string;
  abstained: boolean;
}

@Injectable()
export class CitedChatGenerationService {
  private readonly logger = new Logger(CitedChatGenerationService.name);

  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    @Inject(EMBEDDING_PORT) private readonly embedding: EmbeddingPort,
    private readonly retrieval: PgCitedChatRetrievalRepository,
    private readonly citationsRepo: PgChatMessageCitationsRepository
  ) {}

  async generate(input: CitedChatGenerationInput): Promise<CitedChatGenerationResult> {
    const { messageId, threadId, userId, userMessage, scope } = input;
    const documentIds = sanitizeChatThreadDocumentIds(input.documentIds);

    try {
      return await this.runGeneration({
        messageId,
        threadId,
        userId,
        userMessage,
        documentIds,
        scope,
      });
    } catch (err) {
      this.logger.warn(`Cited chat generation failed for ${messageId}: ${String(err)}`);
      await this.failGeneration(
        messageId,
        threadId,
        userId,
        'unknown',
        err instanceof Error ? err.message : String(err)
      );
      return { content: '', abstained: true };
    }
  }

  private async runGeneration(input: {
    messageId: string;
    threadId: string;
    userId: string;
    userMessage: string;
    documentIds: string[];
    scope: 'document' | 'library';
  }): Promise<CitedChatGenerationResult> {
    const { messageId, threadId, userId, userMessage, documentIds, scope } = input;

    await this.threads.updateMessageGeneration(messageId, {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });

    let queryVector: number[] | undefined;
    try {
      const { embeddings } = await this.embedding.embedTexts([userMessage]);
      queryVector = embeddings[0];
    } catch {
      queryVector = undefined;
    }

    const filterIds =
      scope === 'document' && documentIds.length > 0 ? documentIds : undefined;

    const candidates = await this.retrieval.hybridRetrieveChunks(userId, userMessage, {
      documentIds: filterIds,
      queryVector,
    });

    if (candidates.length === 0) {
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.threads.updateMessageGeneration(messageId, {
        content: CITED_CHAT_ABSTENTION_DE,
        generationStatus: 'done',
        generationPhase: null,
      });
      await this.threads.touchThread(threadId);
      return { content: CITED_CHAT_ABSTENTION_DE, abstained: true };
    }

    const rerank = await fetchWorkerRagRerank(
      userMessage,
      candidates.map((c) => ({
        id: c.chunkId,
        text: this.retrieval.indexPassageForRerank(c),
      }))
    );

    let ranked: Array<{ chunk: (typeof candidates)[0]; score: number }>;
    if (rerank.reachable && rerank.rerankerUsed && rerank.results.length > 0) {
      ranked = rerank.results
        .map((r) => {
          const chunk = candidates.find((c) => c.chunkId === r.id);
          return chunk ? { chunk, score: r.score } : null;
        })
        .filter((row): row is { chunk: (typeof candidates)[0]; score: number } => row != null);
    } else {
      ranked = candidates
        .slice()
        .sort((a, b) => b.fusionScore - a.fusionScore)
        .slice(0, RAG_RERANK_TOP_K)
        .map((chunk) => ({ chunk, score: chunk.fusionScore }));
    }

    const top = ranked.slice(0, RAG_RERANK_TOP_K);
    const bestScore = top[0]?.score ?? -1;
    const gateOk =
      rerank.reachable && rerank.rerankerUsed
        ? passesRerankerGate(bestScore, ragRerankerGateThreshold())
        : passesFusionGate(bestScore, ragFusionGateThreshold());
    if (!gateOk) {
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.threads.updateMessageGeneration(messageId, {
        content: CITED_CHAT_ABSTENTION_DE,
        generationStatus: 'done',
        generationPhase: null,
      });
      await this.threads.touchThread(threadId);
      return { content: CITED_CHAT_ABSTENTION_DE, abstained: true };
    }

    await this.threads.updateMessageGeneration(messageId, {
      generationStatus: 'streaming',
      generationPhase: 'generating',
    });

    const labelByChunk = new Map<string, string>();
    top.forEach((row, i) => {
      labelByChunk.set(row.chunk.chunkId, `S${i + 1}`);
    });

    const priorMessages = await this.threads.listMessages(threadId, userId);
    const history = priorMessages
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.generationStatus === 'done'))
      .slice(-2)
      .map(({ role, content }) => ({ role, content }));

    const systemPrompt = buildCitedChatSystemPrompt(
      top.map((row) => ({
        label: labelByChunk.get(row.chunk.chunkId) ?? 'S?',
        text: this.retrieval.indexPassageForRerank(row.chunk),
      }))
    );

    let lastFlush = 0;
    const llm = await requestCitedAnswerFromOllama(userMessage, systemPrompt, history, {
      onToken: async (partial) => {
        const now = Date.now();
        if (now - lastFlush < CONTENT_FLUSH_MS) {
          return;
        }
        lastFlush = now;
        await this.threads.updateMessageGeneration(messageId, {
          content: partial,
          generationStatus: 'streaming',
          generationPhase: 'generating',
        });
      },
    });
    if (!llm.ok) {
      await this.failGeneration(messageId, threadId, userId, 'ollama_error', llm.detail);
      return { content: '', abstained: true };
    }

    await this.threads.updateMessageGeneration(messageId, {
      generationStatus: 'streaming',
      generationPhase: 'verifying',
    });

    const verified: Array<{
      ordinal: number;
      text: string;
      chunkId: string;
      quote: string;
      charStart: number;
      charEnd: number;
    }> = [];

    let ordinal = 1;
    for (const claim of llm.parsed.claims) {
      const chunkRow = top.find((row) => labelByChunk.get(row.chunk.chunkId) === claim.source.trim());
      if (!chunkRow) {
        continue;
      }
      const match = findQuoteInChunk(chunkRow.chunk.body, claim.quote);
      if (!match) {
        continue;
      }
      const text = claim.text.trim();
      if (!text) {
        continue;
      }
      verified.push({
        ordinal,
        text,
        chunkId: chunkRow.chunk.chunkId,
        quote: match.bodyQuote,
        charStart: (chunkRow.chunk.charStart ?? 0) + match.charStart,
        charEnd: (chunkRow.chunk.charStart ?? 0) + match.charEnd,
      });
      ordinal += 1;
    }

    if (verified.length === 0) {
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.threads.updateMessageGeneration(messageId, {
        content: CITED_CHAT_ABSTENTION_DE,
        generationStatus: 'done',
        generationPhase: null,
      });
      await this.threads.touchThread(threadId);
      return { content: CITED_CHAT_ABSTENTION_DE, abstained: true };
    }

    await this.citationsRepo.replaceCitations(
      messageId,
      verified.map((v) => ({
        ordinal: v.ordinal,
        chunkId: v.chunkId,
        quote: v.quote,
        charStart: v.charStart,
        charEnd: v.charEnd,
      }))
    );

    const content = verified
      .map((v) => `${v.text} [${v.ordinal}]`)
      .join(' ');

    await this.threads.updateMessageGeneration(messageId, {
      content,
      generationStatus: 'done',
      generationPhase: null,
    });
    await this.threads.touchThread(threadId);
    return { content, abstained: false };
  }

  private async failGeneration(
    messageId: string,
    threadId: string,
    userId: string,
    errorCode: string,
    errorDetail: string
  ): Promise<void> {
    const existing = await this.threads.findMessageForUser(messageId, userId);
    await this.threads.updateMessageGeneration(messageId, {
      generationStatus: 'failed',
      generationPhase: null,
      errorCode,
      errorDetail,
      content: existing?.content ?? '',
    });
    await this.threads.touchThread(threadId);
  }
}
