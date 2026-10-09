import type { DocumentChatMessageRecordDto } from '@docuvate/contracts';
import type { DocumentChatMessageEntity } from '../../../shared/domain/ports.js';
import { normalizeLegacyAssistantStatus } from './document-chat-generation-status.js';

export function toDocumentChatMessageRecordDto(
  entity: DocumentChatMessageEntity
): DocumentChatMessageRecordDto {
  const generationStatus =
    entity.role === 'assistant'
      ? normalizeLegacyAssistantStatus(entity.generationStatus ?? null)
      : null;
  return {
    id: entity.id,
    role: entity.role,
    content: entity.content,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    generationStatus,
    generationPhase: entity.generationPhase ?? null,
    errorCode: entity.errorCode ?? null,
    citations: entity.citations?.map((c) => ({
      ordinal: c.ordinal,
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      page: c.page,
      charStart: c.charStart,
      charEnd: c.charEnd,
      quote: c.quote,
      blocks: c.blocks,
    })),
  };
}
