// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
  EMBEDDING_PORT,
  type EmbeddingPort,
} from '../../../shared/domain/ports.js';
import { sanitizeChatThreadDocumentIds } from '../../documents/domain/chat-thread-document-ids.js';
import { ExactFactQueryRouterService } from '../../exact-facts/application/exact-fact-query-router.service.js';
import { TryExactFactChatAnswerUseCase } from '../../exact-facts/application/try-exact-fact-chat-answer.use-case.js';
import {
  EXACT_FACT_ABSTENTION_DE,
  EXACT_FACT_ABSTENTION_EN,
} from '../../exact-facts/domain/exact-fact-abstention-messages.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import {
  type ChatAnswerType,
  classifyChatAnswerType,
  prefersAmountExtractiveAnswer,
} from '../domain/chat-answer-type-prototypes.schema.js';
import { isDocumentOverviewQuestion } from '../domain/chat-document-overview.schema.js';
import { serializeCitedChatBenchStats } from '../domain/cited-chat-bench-stats.js';
import {
  CITED_CHAT_ABSTENTION_DE,
  CITED_CHAT_ABSTENTION_EN,
  citedChatBenchStatsEnabled,
  RAG_RERANK_TOP_K,
  ragFusionGateThreshold,
  ragRerankerGateThreshold,
} from '../domain/cited-chat-constants.js';
import { preferExtractiveChatAnswer } from '../domain/cited-chat-extractive-first.js';
import { rejectedClaimsAllowRetrievalFallback } from '../domain/cited-chat-retrieval-fallback-eligibility.js';
import { buildPassageWithStructuredContext } from '../domain/cited-chat-structured-context.js';
import { diversifyLibraryRerank } from '../domain/diversify-reranked-chunks.js';
import { extractCompleteCitedClaims } from '../domain/extract-complete-cited-claims.js';
import { formatLibraryExtractiveAnswer } from '../domain/format-library-extractive-answer.js';
import { formatVerifiedCitedContent } from '../domain/format-verified-cited-content.js';
import { libraryExtractiveRows } from '../domain/library-extractive-eligibility.js';
import {
  buildLibraryMetadataEmbedText,
  libraryMetadataEmbeddingBoost,
} from '../domain/library-query-metadata-boost.js';
import {
  libraryTenantLabelEmbeddingBoost,
  type TenantLabelEmbeddingRow,
  tenantLabelsAlignedWithQuery,
} from '../domain/library-tenant-label-embedding-boost.js';
import {
  passesCalibratedRetrievalGate,
  shouldAttemptCitedLlm,
} from '../domain/rag-llm-eligibility.js';
import { buildRetrievalFallbackCitation } from '../domain/retrieval-span-citation.js';
import { chunkIndexText } from '../domain/split-text-chunks-with-spans.js';
import {
  buildRejectedClaimBenchLog,
  normalizeCitedSourceLabel,
  verifyCitedClaims,
} from '../domain/verify-cited-claims.js';
import { fetchWorkerExtractiveAnswer } from '../infrastructure/fetch-worker-extractive-answer.js';
import { fetchWorkerRagRerank } from '../infrastructure/fetch-worker-rag-rerank.js';
import { PgChatMessageCitationsRepository } from '../infrastructure/pg-chat-message-citations.repository.js';
import {
  type CitedChatChunkCandidate,
  PgCitedChatRetrievalRepository,
} from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import { ChatQueryRouterService } from './chat-query-router.service.js';
import { resolveCitedChatLlmConfig } from './cited-chat-llm.js';
import {
  buildCitedChatSystemPrompt,
  requestCitedAnswerFromOllama,
} from './cited-chat-ollama.js';

const CONTENT_FLUSH_MS = 250;
const GENERATION_HEARTBEAT_MS = 15_000;

export interface CitedChatGenerationInput {
  messageId: string;
  threadId: string;
  userId: string;
  userMessage: string;
  documentIds: string[];
  scope: 'document' | 'library';
  locale?: 'de' | 'en' | null;
  cloudLlm?: {
    baseUrl?: string | null;
    apiKey?: string | null;
    model?: string | null;
  };
  shouldAbort?: () => boolean | Promise<boolean>;
  onHeartbeat?: () => void | Promise<void>;
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
    private readonly citationsRepo: PgChatMessageCitationsRepository,
    private readonly queryRouter: ChatQueryRouterService,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase,
    private readonly exactFactQueryRouter: ExactFactQueryRouterService,
    private readonly exactFactChat: TryExactFactChatAnswerUseCase
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
        locale: input.locale ?? 'de',
        cloudLlm: input.cloudLlm,
        shouldAbort: input.shouldAbort,
        onHeartbeat: input.onHeartbeat,
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
    locale: 'de' | 'en';
    cloudLlm?: {
      baseUrl?: string | null;
      apiKey?: string | null;
      model?: string | null;
    };
    shouldAbort?: () => boolean | Promise<boolean>;
    onHeartbeat?: () => void | Promise<void>;
  }): Promise<CitedChatGenerationResult> {
    const { messageId, threadId, userId, userMessage, documentIds, scope, locale, shouldAbort, onHeartbeat } =
      input;
    const abstentionText = locale === 'en' ? CITED_CHAT_ABSTENTION_EN : CITED_CHAT_ABSTENTION_DE;

    let lastHeartbeat = Date.now();
    const heartbeat = async (): Promise<void> => {
      const now = Date.now();
      if (now - lastHeartbeat < GENERATION_HEARTBEAT_MS) {
        return;
      }
      lastHeartbeat = now;
      await onHeartbeat?.();
    };

    const aborted = async (): Promise<boolean> => (await shouldAbort?.()) ?? false;
    if (await aborted()) {
      await this.failGeneration(messageId, threadId, userId, 'cancelled', 'User cancelled generation');
      return { content: '', abstained: true };
    }

    await this.threads.updateMessageGeneration(messageId, {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    await heartbeat();

    const priorMessages = await this.threads.listMessages(threadId, userId);
    const priorUserMessage =
      priorMessages
        .filter((m) => m.role === 'user' && m.id !== messageId)
        .at(-1)?.content ?? null;

    const routed = await this.queryRouter.route({
      userId,
      userMessage,
      priorUserMessage,
      scope,
      locale,
      cloudLlm: input.cloudLlm,
    });
    if (routed.kind === 'answered') {
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.threads.updateMessageGeneration(messageId, {
        content: routed.content,
        generationStatus: 'done',
        generationPhase: null,
        finalizeOnlyIfInFlight: true,
      });
      await this.threads.touchThread(threadId);
      return { content: routed.content, abstained: false };
    }
    const retrievalQuery = routed.resolvedQuery;

    const featureFlags = await this.resolveFeatureFlags.execute(userId);
    if (featureFlags.exactAnswers) {
      const parsedExact = this.exactFactQueryRouter.parse(userMessage);
      if (parsedExact) {
        const exactAnswer = await this.exactFactChat.execute({
          tenantId: userId,
          query: parsedExact,
          locale,
          scope,
          documentIds,
          answerAbstention: featureFlags.answerAbstention,
        });
        if (exactAnswer) {
          await this.citationsRepo.replaceCitations(
            messageId,
            exactAnswer.citations.map((citation) => ({
              ordinal: citation.ordinal,
              chunkId: citation.chunkId,
              quote: citation.quote,
              charStart: citation.charStart,
              charEnd: citation.charEnd,
            }))
          );
          await this.threads.updateMessageGeneration(messageId, {
            content: exactAnswer.content,
            generationStatus: 'done',
            generationPhase: null,
            finalizeOnlyIfInFlight: true,
          });
          await this.threads.touchThread(threadId);
          return { content: exactAnswer.content, abstained: exactAnswer.abstained };
        }
        if (featureFlags.answerAbstention) {
          const exactAbstention = locale === 'en' ? EXACT_FACT_ABSTENTION_EN : EXACT_FACT_ABSTENTION_DE;
          await this.citationsRepo.replaceCitations(messageId, []);
          await this.threads.updateMessageGeneration(messageId, {
            content: exactAbstention,
            generationStatus: 'done',
            generationPhase: null,
            finalizeOnlyIfInFlight: true,
          });
          await this.threads.touchThread(threadId);
          return { content: exactAbstention, abstained: true };
        }
      }
    }

    const generationStarted = Date.now();
    let embedMs = 0;
    let retrieveMs = 0;
    let rerankMs = 0;
    let llmMs = 0;

    let queryVector: number[] | undefined;
    const embedStarted = Date.now();
    try {
      const { embeddings } = await this.embedding.embedTexts([retrievalQuery], {
        inputType: 'query',
      });
      queryVector = embeddings[0];
    } catch {
      queryVector = undefined;
    }
    embedMs = Date.now() - embedStarted;

    const answerType: ChatAnswerType =
      queryVector != null && queryVector.length > 0
        ? classifyChatAnswerType(queryVector)
        : 'free_text';

    const filterIds =
      scope === 'document' && documentIds.length > 0 ? documentIds : undefined;

    const documentOverview =
      scope === 'document' &&
      filterIds != null &&
      filterIds.length > 0 &&
      queryVector != null &&
      queryVector.length > 0 &&
      isDocumentOverviewQuestion(queryVector);

    const retrieveStarted = Date.now();
    let candidates = documentOverview
      ? await this.retrieval.loadScopedDocumentChunks(userId, filterIds)
      : await this.retrieval.hybridRetrieveChunks(userId, retrievalQuery, {
          documentIds: filterIds,
          queryVector,
        });
    if (scope === 'library') {
      const contextualExtra = await this.retrieval.supplementContextualLibraryCandidates(
        userId,
        userMessage,
        answerType
      );
      if (contextualExtra.length > 0) {
        const seen = new Set(candidates.map((chunk) => chunk.chunkId));
        for (const extra of contextualExtra) {
          if (!seen.has(extra.chunkId)) {
            candidates.push(extra);
            seen.add(extra.chunkId);
          }
        }
      }
      if (candidates.length > 0 && queryVector != null && queryVector.length > 0) {
        const boostMeta = await this.retrieval.loadDocumentContextMeta(
          userId,
          candidates.map((chunk) => chunk.documentId)
        );
        const tenantLabelEmbeds = await this.loadTenantLabelEmbeddings(userId);
        const alignedLabels = tenantLabelsAlignedWithQuery(queryVector, tenantLabelEmbeds);
        const metaTexts = [...boostMeta.entries()].map(([documentId, meta]) => ({
          documentId,
          text: buildLibraryMetadataEmbedText({
            title: meta.title,
            filename: meta.filename,
            documentDate: meta.documentDate,
          }),
        }));
        const metaEmbedResult = await this.embedding.embedTexts(
          metaTexts.map((row) => row.text),
          { inputType: 'passage' }
        );
        const metaVectorByDoc = new Map<string, number[]>();
        metaTexts.forEach((row, index) => {
          const vector = metaEmbedResult.embeddings.at(index);
          if (vector !== undefined && vector.length > 0) {
            metaVectorByDoc.set(row.documentId, vector);
          }
        });
        candidates = candidates
          .map((chunk) => {
            const meta = boostMeta.get(chunk.documentId);
            const boost =
              libraryMetadataEmbeddingBoost(queryVector, metaVectorByDoc.get(chunk.documentId)) +
              libraryTenantLabelEmbeddingBoost({
                alignedLabels,
                filename: meta?.filename ?? chunk.documentTitle,
                title: meta?.title ?? chunk.documentTitle,
                body: chunk.body,
                documentLabelNames: meta?.labels ?? [],
              });
            return { ...chunk, fusionScore: chunk.fusionScore + boost };
          })
          .sort((a, b) => b.fusionScore - a.fusionScore);
      }
    }
    retrieveMs = Date.now() - retrieveStarted;
    const chunkPool = candidates.map((chunk) => ({ chunk }));

    if (await aborted()) {
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.failGeneration(messageId, threadId, userId, 'cancelled', 'User cancelled generation');
      return { content: '', abstained: true };
    }

    if (candidates.length === 0) {
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.threads.updateMessageGeneration(messageId, {
        content: abstentionText,
        generationStatus: 'done',
        generationPhase: null,
        finalizeOnlyIfInFlight: true,
      });
      await this.threads.touchThread(threadId);
      return { content: abstentionText, abstained: true };
    }

    const rerankStarted = Date.now();
    const rerank = await fetchWorkerRagRerank(
      retrievalQuery,
      candidates.map((c) => ({
        id: c.chunkId,
        text: this.retrieval.indexPassageForRerank(c),
      }))
    );
    rerankMs = Date.now() - rerankStarted;

    let ranked: { chunk: (typeof candidates)[0]; score: number }[];
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

    const top =
      scope === 'library'
        ? diversifyLibraryRerank(ranked, RAG_RERANK_TOP_K)
        : ranked.slice(0, RAG_RERANK_TOP_K);
    const rerankerUsed = rerank.reachable && rerank.rerankerUsed;
    const bestScore = top[0]?.score ?? -1;
    const gateOk =
      documentOverview || passesCalibratedRetrievalGate({ bestScore, rerankerUsed });
    const llmAttempt =
      documentOverview || shouldAttemptCitedLlm({ bestScore, rerankerUsed });
    const llmConfigured =
      resolveCitedChatLlmConfig({
        cloudBaseUrl: input.cloudLlm?.baseUrl,
        cloudApiKey: input.cloudLlm?.apiKey,
        cloudModel: input.cloudLlm?.model,
      }) != null;

    const extractiveMinScore = rerankerUsed
      ? ragRerankerGateThreshold()
      : ragFusionGateThreshold();
    const extractivePool =
      scope === 'library' ? libraryExtractiveRows(top) : top.slice(0, RAG_RERANK_TOP_K);

    const documentMeta = await this.retrieval.loadDocumentContextMeta(
      userId,
      top.map((row) => row.chunk.documentId)
    );

    const libraryAmountExtractive =
      llmConfigured &&
      scope === 'library' &&
      gateOk &&
      prefersAmountExtractiveAnswer(queryVector)
        ? await this.resolveExtractiveAnswer(
            userMessage,
            extractivePool,
            extractiveMinScore,
            scope,
            locale,
            answerType
          )
        : null;
    if (libraryAmountExtractive) {
      return this.publishExtractiveResult({
        messageId,
        threadId,
        text: libraryAmountExtractive.text,
        chunk: libraryAmountExtractive.chunk,
        quote: libraryAmountExtractive.quote,
      });
    }

    if (!llmConfigured) {
      const extractive =
        extractivePool.length > 0 && gateOk
          ? await this.resolveExtractiveAnswer(
              userMessage,
              extractivePool,
              extractiveMinScore,
              scope,
              locale,
              answerType
            )
          : null;
      if (!gateOk) {
        const extractiveChunkId = extractive?.chunk.chunkId ?? '';
        const extractiveChunkIsUuid = /^[0-9a-f-]{36}$/i.test(extractiveChunkId);
        if (extractive && extractiveChunkIsUuid) {
          await this.citationsRepo.replaceCitations(messageId, [
            {
              ordinal: 1,
              chunkId: extractive.chunk.chunkId,
              quote: extractive.quote,
              charStart: extractive.chunk.charStart ?? 0,
              charEnd: extractive.chunk.charEnd ?? extractive.quote.length,
            },
          ]);
          const content = formatVerifiedCitedContent([{ text: extractive.text, ordinal: 1 }]);
          await this.threads.updateMessageGeneration(messageId, {
            content,
            generationStatus: 'done',
            generationPhase: null,
            finalizeOnlyIfInFlight: true,
          });
          await this.threads.touchThread(threadId);
          return { content, abstained: false };
        }
        await this.citationsRepo.replaceCitations(messageId, []);
        await this.threads.updateMessageGeneration(messageId, {
          content: abstentionText,
          generationStatus: 'done',
          generationPhase: null,
          finalizeOnlyIfInFlight: true,
        });
        await this.threads.touchThread(threadId);
        return { content: abstentionText, abstained: true };
      }
      if (extractive) {
        return this.publishExtractiveResult({
          messageId,
          threadId,
          text: extractive.text,
          chunk: extractive.chunk,
          quote: extractive.quote,
        });
      }
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.threads.updateMessageGeneration(messageId, {
        content: abstentionText,
        generationStatus: 'done',
        generationPhase: null,
        finalizeOnlyIfInFlight: true,
      });
      await this.threads.touchThread(threadId);
      return { content: abstentionText, abstained: true };
    }

    if (!llmAttempt) {
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.threads.updateMessageGeneration(messageId, {
        content: abstentionText,
        generationStatus: 'done',
        generationPhase: null,
        finalizeOnlyIfInFlight: true,
      });
      await this.threads.touchThread(threadId);
      return { content: abstentionText, abstained: true };
    }

    if (await aborted()) {
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.failGeneration(messageId, threadId, userId, 'cancelled', 'User cancelled generation');
      return { content: '', abstained: true };
    }

    if (preferExtractiveChatAnswer(queryVector) && gateOk && extractivePool.length > 0) {
      const earlyExtractive = await this.resolveExtractiveAnswer(
        userMessage,
        extractivePool,
        extractiveMinScore,
        scope,
        locale,
        answerType
      );
      if (earlyExtractive) {
        return this.publishExtractiveResult({
          messageId,
          threadId,
          text: earlyExtractive.text,
          chunk: earlyExtractive.chunk,
          quote: earlyExtractive.quote,
        });
      }
    }

    await this.threads.updateMessageGeneration(messageId, {
      generationStatus: 'streaming',
      generationPhase: 'generating',
    });

    const labelByChunk = new Map<string, string>();
    top.forEach((row, i) => {
      labelByChunk.set(row.chunk.chunkId, `S${String(i + 1)}`);
    });

    const history = priorMessages
      .filter((m) => m.role === 'user' || m.generationStatus === 'done')
      .slice(-2)
      .map(({ role, content }) => ({ role, content }));

    const systemPrompt = buildCitedChatSystemPrompt(
      top.map((row) => ({
        label: labelByChunk.get(row.chunk.chunkId) ?? 'S?',
        text: buildPassageWithStructuredContext(
          documentMeta.get(row.chunk.documentId),
          this.retrieval.indexPassageForRerank(row.chunk)
        ),
      })),
      locale
    );

    let lastFlush = 0;
    let hasStreamedContent = false;
    let processedClaimCount = 0;
    const streamedVerified: { text: string; ordinal: number }[] = [];
    const llmStarted = Date.now();
    const llm = await requestCitedAnswerFromOllama(retrievalQuery, systemPrompt, history, {
      locale,
      cloudBaseUrl: input.cloudLlm?.baseUrl,
      cloudApiKey: input.cloudLlm?.apiKey,
      cloudModel: input.cloudLlm?.model,
      shouldAbort: () => aborted(),
      onToken: async (partialJson) => {
        await heartbeat();
        const partialClaims = extractCompleteCitedClaims(partialJson);
        if (partialClaims.length <= processedClaimCount) {
          return;
        }
        const newClaims = partialClaims.slice(processedClaimCount);
        processedClaimCount = partialClaims.length;
        for (const claim of newClaims) {
          const { verified } = verifyCitedClaims({
            claims: [claim],
            top,
            labelByChunk,
            chunkPool,
          });
          if (verified.length === 0) {
            continue;
          }
          const streamOrdinal = streamedVerified.length + 1;
          streamedVerified.push({
            text: verified[0].text,
            ordinal: streamOrdinal,
          });
        }
        if (streamedVerified.length === 0) {
          return;
        }
        const contentPreview = formatVerifiedCitedContent(streamedVerified);
        const now = Date.now();
        if (hasStreamedContent && now - lastFlush < CONTENT_FLUSH_MS) {
          return;
        }
        lastFlush = now;
        hasStreamedContent = true;
        await this.threads.updateMessageGeneration(messageId, {
          content: contentPreview,
          generationStatus: 'streaming',
          generationPhase: 'verifying',
        });
      },
    });
    llmMs = Date.now() - llmStarted;
    if (!llm.ok) {
      if (llm.detail === 'aborted' || llm.detail === 'cancelled') {
        await this.citationsRepo.replaceCitations(messageId, []);
        await this.failGeneration(messageId, threadId, userId, 'cancelled', 'User cancelled generation');
        return { content: '', abstained: true };
      }
      const llmFallbackExtractive =
        gateOk && extractivePool.length > 0
          ? await this.resolveExtractiveAnswer(
              userMessage,
              extractivePool,
              extractiveMinScore,
              scope,
              locale,
              answerType
            )
          : null;
      if (llmFallbackExtractive) {
        const extractiveChunkId = llmFallbackExtractive.chunk.chunkId;
        const extractiveChunkIsUuid = /^[0-9a-f-]{36}$/i.test(extractiveChunkId);
        if (extractiveChunkIsUuid) {
          await this.citationsRepo.replaceCitations(messageId, [
            {
              ordinal: 1,
              chunkId: llmFallbackExtractive.chunk.chunkId,
              quote: llmFallbackExtractive.quote,
              charStart: llmFallbackExtractive.chunk.charStart ?? 0,
              charEnd: llmFallbackExtractive.chunk.charEnd ?? llmFallbackExtractive.quote.length,
            },
          ]);
        } else {
          await this.citationsRepo.replaceCitations(messageId, []);
        }
        const content = extractiveChunkIsUuid
          ? formatVerifiedCitedContent([{ text: llmFallbackExtractive.text, ordinal: 1 }])
          : llmFallbackExtractive.text;
        await this.threads.updateMessageGeneration(messageId, {
          content,
          generationStatus: 'done',
          generationPhase: null,
          finalizeOnlyIfInFlight: true,
        });
        await this.threads.touchThread(threadId);
        return { content, abstained: false };
      }
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.threads.updateMessageGeneration(messageId, {
        content: abstentionText,
        generationStatus: 'done',
        generationPhase: null,
        finalizeOnlyIfInFlight: true,
      });
      await this.threads.touchThread(threadId);
      return { content: abstentionText, abstained: true };
    }

    if (await aborted()) {
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.failGeneration(messageId, threadId, userId, 'cancelled', 'User cancelled generation');
      return { content: '', abstained: true };
    }

    await this.threads.updateMessageGeneration(messageId, {
      generationStatus: 'streaming',
      generationPhase: 'verifying',
    });

    const verifyStarted = Date.now();
    const { verified, rejected } = verifyCitedClaims({
      claims: llm.parsed.claims,
      top,
      labelByChunk,
      chunkPool,
    });
    const verifyMs = Date.now() - verifyStarted;
    const labelSet = new Set(labelByChunk.values());
    if (citedChatBenchStatsEnabled() && rejected.length > 0) {
      for (const rej of rejected) {
        const citedLabel = rej.source ? normalizeCitedSourceLabel(rej.source, labelSet) : null;
        const labeledRow = citedLabel
          ? top.find((row) => labelByChunk.get(row.chunk.chunkId) === citedLabel)
          : undefined;
        this.logger.log(
          JSON.stringify(
            buildRejectedClaimBenchLog({
              rejected: rej,
              citedLabel,
              labeledChunkId: labeledRow?.chunk.chunkId ?? null,
              resolvedChunkId: null,
              chunkBody: labeledRow?.chunk.body ?? null,
              passageText: labeledRow
                ? chunkIndexText(labeledRow.chunk.documentTitle, labeledRow.chunk.body)
                : null,
            })
          )
        );
      }
    } else if (!citedChatBenchStatsEnabled()) {
      for (const rej of rejected) {
        this.logger.debug(
          `Cited claim rejected: ${JSON.stringify({
            claimText: rej.claimText,
            quote: rej.quote,
            bestMatchScore: rej.bestMatchScore,
            reason: rej.reason,
          })}`
        );
      }
    }
    const benchStats = citedChatBenchStatsEnabled()
      ? serializeCitedChatBenchStats({
          citedRejectedClaims: rejected.length,
          timingMs: {
            embedMs,
            retrieveMs,
            rerankMs,
            llmMs,
            verifyMs,
            totalMs: Date.now() - generationStarted,
            promptChars: systemPrompt.length,
          },
        })
      : undefined;

    if (verified.length === 0) {
      const allowRetrievalFallback = rejectedClaimsAllowRetrievalFallback(rejected);
      const libraryAmountExtractiveFallback =
        scope === 'library' && prefersAmountExtractiveAnswer(queryVector);
      if (
        gateOk &&
        extractivePool.length > 0 &&
        (allowRetrievalFallback || libraryAmountExtractiveFallback)
      ) {
        const postVerifyExtractive = await this.resolveExtractiveAnswer(
          userMessage,
          extractivePool,
          extractiveMinScore,
          scope,
          locale,
          answerType
        );
        if (postVerifyExtractive) {
          return this.publishExtractiveResult({
            messageId,
            threadId,
            text: postVerifyExtractive.text,
            chunk: postVerifyExtractive.chunk,
            quote: postVerifyExtractive.quote,
            errorDetail: benchStats,
          });
        }
      }
      const primaryClaim = llm.parsed.claims[0]?.text?.trim() ?? '';
      if (allowRetrievalFallback && gateOk && top.length > 0) {
        const topRow = top[0];
        const fallback = buildRetrievalFallbackCitation({
          chunk: topRow.chunk,
          query: retrievalQuery,
          claimText: primaryClaim,
        });
        if (fallback) {
          let fallbackText = fallback.text;
          if (scope === 'library') {
            fallbackText = formatLibraryExtractiveAnswer({
              userMessage,
              quote: fallback.quote,
              documentTitle: topRow.chunk.documentTitle,
              locale,
              answerType,
            });
          }
          return this.publishExtractiveResult({
            messageId,
            threadId,
            text: fallbackText,
            chunk: topRow.chunk,
            quote: fallback.quote,
            charStart: fallback.charStart,
            charEnd: fallback.charEnd,
            errorDetail: benchStats,
          });
        }
      }
      await this.citationsRepo.replaceCitations(messageId, []);
      await this.threads.updateMessageGeneration(messageId, {
        content: abstentionText,
        generationStatus: 'done',
        generationPhase: null,
        errorDetail: benchStats,
        finalizeOnlyIfInFlight: true,
      });
      await this.threads.touchThread(threadId);
      return { content: abstentionText, abstained: true };
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

    const content = formatVerifiedCitedContent(
      verified.map((v) => ({ text: v.text, ordinal: v.ordinal }))
    );

    if (citedChatBenchStatsEnabled() && rejected.length > 0) {
      this.logger.log(
        `Cited chat bench: ${String(rejected.length)} rejected claim(s) for message ${messageId}`
      );
    }

    await this.threads.updateMessageGeneration(messageId, {
      content,
      generationStatus: 'done',
      generationPhase: null,
      errorDetail: benchStats,
      finalizeOnlyIfInFlight: true,
    });
    await this.threads.touchThread(threadId);
    return { content, abstained: false };
  }

  private async publishExtractiveResult(input: {
    messageId: string;
    threadId: string;
    text: string;
    chunk: CitedChatChunkCandidate;
    quote: string;
    charStart?: number;
    charEnd?: number;
    errorDetail?: string;
  }): Promise<CitedChatGenerationResult> {
    const extractiveChunkId = input.chunk.chunkId;
    const extractiveChunkIsUuid = /^[0-9a-f-]{36}$/i.test(extractiveChunkId);
    const charStart = input.charStart ?? input.chunk.charStart ?? 0;
    const charEnd = input.charEnd ?? input.chunk.charEnd ?? input.quote.length;
    if (extractiveChunkIsUuid) {
      await this.citationsRepo.replaceCitations(input.messageId, [
        {
          ordinal: 1,
          chunkId: input.chunk.chunkId,
          quote: input.quote,
          charStart,
          charEnd,
        },
      ]);
    } else {
      await this.citationsRepo.replaceCitations(input.messageId, []);
    }
    const content = extractiveChunkIsUuid
      ? formatVerifiedCitedContent([{ text: input.text, ordinal: 1 }])
      : input.text;
    await this.threads.updateMessageGeneration(input.messageId, {
      content,
      generationStatus: 'done',
      generationPhase: null,
      errorDetail: input.errorDetail,
      finalizeOnlyIfInFlight: true,
    });
    await this.threads.touchThread(input.threadId);
    return { content, abstained: false };
  }

  private async loadTenantLabelEmbeddings(userId: string): Promise<TenantLabelEmbeddingRow[]> {
    const names = await this.retrieval.listTenantLabelNames(userId);
    if (names.length === 0) {
      return [];
    }
    const embedResult = await this.embedding.embedTexts(names, { inputType: 'passage' });
    return names.flatMap((name, index) => {
      const vector = embedResult.embeddings.at(index);
      if (vector === undefined || vector.length === 0) {
        return [];
      }
      return [{ name, vector }];
    });
  }

  private async resolveExtractiveAnswer(
    query: string,
    ranked: { chunk: CitedChatChunkCandidate; score: number }[],
    minScore: number,
    scope: 'document' | 'library',
    locale: 'de' | 'en',
    answerType: ChatAnswerType
  ): Promise<{ text: string; chunk: CitedChatChunkCandidate; quote: string } | null> {
    if (ranked.length === 0 || ranked[0].score < minScore) {
      return null;
    }
    const passages = ranked.map((row) => ({
      id: row.chunk.chunkId,
      text: row.chunk.body,
    }));
    const worker = await fetchWorkerExtractiveAnswer(query, passages);
    if (!worker.reachable || !worker.passageId || !worker.answer) {
      return null;
    }
    const match = ranked.find((row) => row.chunk.chunkId === worker.passageId);
    const chunk = match?.chunk ?? ranked[0].chunk;
    const quote = worker.quote?.trim() ?? worker.answer.trim();
    const text =
      scope === 'library'
        ? formatLibraryExtractiveAnswer({
            userMessage: query,
            quote,
            documentTitle: chunk.documentTitle,
            locale,
            answerType,
          })
        : worker.answer.trim();
    return { text, chunk, quote };
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
      finalizeOnlyIfInFlight: true,
    });
    await this.threads.touchThread(threadId);
  }
}
