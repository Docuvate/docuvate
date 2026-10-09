// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CitedChatBenchStatsDto, DocumentChatMessageRecordDto } from '@docuvate/contracts';
import type { DocumentChatMessageEntity } from '../../../shared/domain/ports.js';
import { citedChatBenchStatsEnabled } from '../../cited-chat/domain/cited-chat-constants.js';
import { normalizeLegacyAssistantStatus } from './document-chat-generation-status.js';

function parseCitedBenchStats(
  errorDetail: string | null | undefined
): CitedChatBenchStatsDto | undefined {
  if (!citedChatBenchStatsEnabled()) {
    return undefined;
  }
  const raw = errorDetail?.trim();
  if (!raw?.startsWith('{')) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as { citedRejectedClaims?: unknown };
    if (typeof parsed.citedRejectedClaims === 'number' && Number.isFinite(parsed.citedRejectedClaims)) {
      return { citedRejectedClaims: parsed.citedRejectedClaims };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

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
    citedBenchStats: parseCitedBenchStats(entity.errorDetail),
  };
}
