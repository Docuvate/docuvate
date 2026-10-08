import { Inject, Injectable } from '@nestjs/common';
import type { ChatMessageDto, DocumentChatResponse } from '@docuvate/contracts';
import {
  DOCUMENT_CHAT_PORT,
  DOCUMENT_REPOSITORY,
  OBJECT_STORAGE,
  USER_PREFERENCES_REPOSITORY,
  type DocumentChatPort,
  type DocumentRepository,
  type ObjectStorage,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { DocumentChatProviderId } from '../../../shared/infrastructure/chat/chat-provider.types.js';
import { EffectiveDocumentChatProviderUseCase } from '../../settings/application/effective-document-chat-provider.use-case.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';

@Injectable()
export class DocumentChatUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_CHAT_PORT) private readonly chat: DocumentChatPort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly documentAuthz: DocumentAuthorizationService,
    private readonly effectiveChatProvider: EffectiveDocumentChatProviderUseCase
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject,
    message: string,
    history: ChatMessageDto[] = []
  ): Promise<DocumentChatResponse> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:chat', doc);

    const safeHistory = history.filter(
      (m) => (m.role === 'user' || m.role === 'assistant') && m.content.trim().length > 0
    );

    const preferences = await this.prefs.getForUser(userId);
    const { customerEffective: providerId } =
      await this.effectiveChatProvider.resolveFromPreference(preferences.preferredChatProvider, {
        persistForUserId: userId,
      });

    if (providerId === 'off') {
      return {
        configured: false,
        provider: 'off',
        setupHint:
          'Dokument-Chat benötigt Ollama (kleines Modell) + Worker für RAG oder Donut DocVQA mit GPU.',
        reply: {
          role: 'assistant',
          content:
            'Dokument-Chat ist derzeit nicht verfügbar. Richten Sie Ollama mit kleinem Modell und WORKER_URL ein oder Donut DocVQA (Einstellungen → Dokument-Chat).',
        },
      };
    }

    let file: { buffer: Buffer; mimeType: string } | undefined;
    if (providerId === 'donut-ml') {
      const buffer = await this.storage.getObject(doc.storageKey);
      file = { buffer, mimeType: doc.mimeType };
    }

    return this.chat.chat(
      message,
      safeHistory,
      {
        title: doc.title,
        filename: doc.filename,
        text: doc.extraction?.text ?? '',
        fields: doc.extraction?.fields ?? [],
      },
      { providerId: providerId as DocumentChatProviderId, file }
    );
  }
}
