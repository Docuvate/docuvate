import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DOCUMENT_CHAT_PORT,
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  DOCUMENT_REPOSITORY,
  OBJECT_STORAGE,
  USER_PREFERENCES_REPOSITORY,
  type DocumentChatPort,
  type DocumentChatThreadRepository,
  type DocumentRepository,
  type ObjectStorage,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { DocumentChatProviderId } from '../../../shared/infrastructure/chat/chat-provider.types.js';
import { EffectiveDocumentChatProviderUseCase } from '../../settings/application/effective-document-chat-provider.use-case.js';
import { buildDocumentRagSystemPrompt } from '../../../shared/infrastructure/chat/build-system-prompt.js';
import { fetchWorkerRagContext } from '../../../shared/infrastructure/chat/fetch-worker-rag-context.js';
import { streamOllamaChat } from '../../../shared/infrastructure/chat/ollama-stream-chat.js';
import { DocumentChatGenerationCancelRegistry } from '../infrastructure/document-chat-generation-cancel.registry.js';
import { DocumentChatGenerationActiveRegistry } from '../infrastructure/document-chat-generation-active.registry.js';
import { CitedChatGenerationService } from '../../cited-chat/application/cited-chat-generation.service.js';
import { sanitizeChatThreadDocumentIds } from '../domain/chat-thread-document-ids.js';

export interface DocumentChatGenerationJobPayload {
  messageId: string;
  threadId: string;
  documentId?: string;
  userId: string;
  userMessage: string;
}

const CONTENT_FLUSH_MS = 400;

@Injectable()
export class RunDocumentChatGenerationUseCase {
  private readonly logger = new Logger(RunDocumentChatGenerationUseCase.name);

  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_CHAT_PORT) private readonly chat: DocumentChatPort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly effectiveChatProvider: EffectiveDocumentChatProviderUseCase,
    private readonly cancelRegistry: DocumentChatGenerationCancelRegistry,
    private readonly activeRegistry: DocumentChatGenerationActiveRegistry,
    private readonly citedChat: CitedChatGenerationService
  ) {}

  async execute(payload: DocumentChatGenerationJobPayload): Promise<void> {
    const { messageId, threadId, documentId, userId, userMessage } = payload;
    await this.cancelRegistry.clear(messageId);
    await this.activeRegistry.markActive(messageId);

    const message = await this.threads.findMessageForUser(messageId, userId);
    if (!message || message.threadId !== threadId || message.role !== 'assistant') {
      throw new NotFoundError('Chat message');
    }

    const thread = await this.threads.findThreadForUser(threadId, userId);
    if (!thread) {
      throw new NotFoundError('Chat thread');
    }

    const threadDocumentIds = sanitizeChatThreadDocumentIds(thread.documentIds);
    const effectiveDocumentId =
      documentId ?? (threadDocumentIds.length === 1 ? threadDocumentIds[0] : undefined);
    const doc =
      effectiveDocumentId != null
        ? await this.documents.findByIdForUser(effectiveDocumentId, userId)
        : null;
    if (thread.scope === 'document' && !doc) {
      throw new NotFoundError('Document');
    }

    const priorMessages = await this.threads.listMessages(threadId, userId);
    const history = priorMessages
      .filter(
        (m) =>
          m.id !== messageId &&
          !(m.role === 'assistant' && (m.generationStatus === 'pending' || m.generationStatus === 'streaming'))
      )
      .slice(-2)
      .map(({ role, content }) => ({ role, content }));

    const preferences = await this.prefs.getForUser(userId);
    const { customerEffective: providerId } =
      await this.effectiveChatProvider.resolveFromPreference(preferences.preferredChatProvider, {
        persistForUserId: userId,
      });

    if (providerId === 'off') {
      await this.failMessage(userId, messageId, 'provider_unavailable', 'Chat provider off');
      return;
    }

    await this.threads.updateMessageGeneration(messageId, {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
      errorCode: null,
      errorDetail: null,
      content: '',
    });

    const context = {
      title: doc?.title ?? 'Bibliothek',
      filename: doc?.filename ?? '',
      text: doc?.extraction?.text ?? '',
      fields: doc?.extraction?.fields ?? [],
    };

    try {
      if (providerId === 'rag-ollama') {
        await this.citedChat.generate({
          messageId,
          threadId,
          userId,
          userMessage,
          documentIds:
            thread.scope === 'library'
              ? threadDocumentIds
              : effectiveDocumentId
                ? [effectiveDocumentId]
                : threadDocumentIds,
          scope: thread.scope === 'library' ? 'library' : 'document',
          shouldAbort: () => this.cancelRegistry.isCancelled(messageId),
          onHeartbeat: async () => {
            await this.threads.touchMessageGenerationHeartbeat(messageId);
            await this.activeRegistry.touchActive(messageId);
          },
        });
        return;
      }

      if (providerId === 'ollama') {
        await this.runOllamaPath(
          userId,
          messageId,
          threadId,
          providerId,
          userMessage,
          history,
          context
        );
        return;
      }

      await this.threads.updateMessageGeneration(messageId, {
        generationStatus: 'streaming',
        generationPhase: 'generating',
      });

      let file: { buffer: Buffer; mimeType: string } | undefined;
      if (providerId === 'donut-ml') {
        if (!doc) {
          throw new NotFoundError('Document');
        }
        const buffer = await this.storage.getObject(doc.storageKey);
        file = { buffer, mimeType: doc.mimeType };
      }

      const result = await this.chat.chat(userMessage, history, context, {
        providerId: providerId as DocumentChatProviderId,
        file,
      });

      if (!result.configured) {
        await this.failMessage(
          userId,
          messageId,
          'provider_unavailable',
          result.setupHint ?? 'Provider not configured'
        );
        return;
      }

      await this.threads.updateMessageGeneration(messageId, {
        content: result.reply.content,
        generationStatus: 'done',
        generationPhase: null,
      });
      await this.threads.touchThread(threadId);
    } catch (err) {
      this.logger.warn(`Chat generation failed for ${messageId}: ${String(err)}`);
      await this.failMessage(
        userId,
        messageId,
        'unknown',
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      await this.cancelRegistry.clear(messageId);
      await this.activeRegistry.clearActive(messageId);
    }
  }

  private async runOllamaPath(
    userId: string,
    messageId: string,
    threadId: string,
    providerId: 'rag-ollama' | 'ollama',
    userMessage: string,
    history: Array<{ role: string; content: string }>,
    context: {
      title: string;
      filename: string;
      text: string;
      fields: Array<{ key: string; value: string }>;
    }
  ): Promise<void> {
    let ragContextText = '';
    if (providerId === 'rag-ollama') {
      const rag = await fetchWorkerRagContext(userMessage, context);
      if (!rag.reachable) {
        await this.failMessage(userId, messageId, 'worker_unreachable', 'Worker RAG unreachable');
        return;
      }
      ragContextText = rag.contextText;
    }

    await this.threads.updateMessageGeneration(messageId, {
      generationStatus: 'streaming',
      generationPhase: 'generating',
    });

    const model = process.env['OLLAMA_MODEL'] ?? 'qwen2.5:1.5b';
    const systemContent =
      providerId === 'rag-ollama'
        ? buildDocumentRagSystemPrompt(context, ragContextText, { ollamaModel: model })
        : `Du beantwortest Fragen zum Dokument „${context.title}“ (${context.filename}).`;

    const messages = [
      { role: 'system', content: systemContent },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    let lastFlush = 0;
    const flushContent = async (content: string) => {
      const now = Date.now();
      if (now - lastFlush < CONTENT_FLUSH_MS) {
        return;
      }
      lastFlush = now;
      await this.threads.updateMessageGeneration(messageId, { content });
    };

    const streamResult = await streamOllamaChat({
      messages,
      onToken: async (_token, fullText) => {
        await flushContent(fullText);
      },
      shouldAbort: () => this.cancelRegistry.isCancelled(messageId),
    });

    if ('failure' in streamResult) {
      const partial = await this.threads.findMessageForUser(messageId, userId);
      const partialContent = partial?.content ?? '';
      if (streamResult.failure.kind === 'aborted') {
        await this.threads.updateMessageGeneration(messageId, {
          generationStatus: 'failed',
          generationPhase: null,
          errorCode: 'cancelled',
          errorDetail: 'User cancelled generation',
          content: partialContent,
        });
        return;
      }
      if (streamResult.failure.kind === 'idle_timeout') {
        await this.threads.updateMessageGeneration(messageId, {
          generationStatus: 'failed',
          generationPhase: null,
          errorCode: 'generation_timeout',
          errorDetail: 'Ollama idle timeout',
          content: partialContent,
        });
        return;
      }
      await this.threads.updateMessageGeneration(messageId, {
        generationStatus: 'failed',
        generationPhase: null,
        errorCode: 'ollama_error',
        errorDetail:
          streamResult.failure.kind === 'http_error'
            ? `HTTP ${streamResult.failure.status}: ${streamResult.failure.detail ?? ''}`
            : streamResult.failure.detail,
        content: partialContent,
      });
      return;
    }

    await this.threads.updateMessageGeneration(messageId, {
      content: streamResult.content || 'Keine Antwort vom Modell.',
      generationStatus: 'done',
      generationPhase: null,
      errorCode: null,
      errorDetail: null,
    });
    await this.threads.touchThread(threadId);
  }

  private async failMessage(
    userId: string,
    messageId: string,
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
  }
}
