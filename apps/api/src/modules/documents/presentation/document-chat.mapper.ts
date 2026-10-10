// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatThreadDto } from '@docuvate/contracts';

import type { DocumentChatThreadEntity } from '../../../shared/domain/ports.js';

export { toDocumentChatMessageRecordDto } from '../application/document-chat-message.mapper.js';

export function toDocumentChatThreadDto(entity: DocumentChatThreadEntity): DocumentChatThreadDto {
  return {
    id: entity.id,
    title: entity.title,
    scope: entity.scope,
    documentIds: entity.documentIds,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    lastMessagePreview: entity.lastMessagePreview ?? null,
    activeGenerationStatus: entity.activeGenerationStatus ?? null,
  };
}
