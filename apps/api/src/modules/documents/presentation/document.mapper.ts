// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type DocumentBulkRequest,
  type DocumentDto,
  type DocumentDuplicateStackSummaryDto,
  documentFormatBadge,
  type DocumentListItemDto,
  documentUsesPdfPreview,
  type RecognizedFieldExtractionAttemptDto,
} from '@docuvate/contracts';

import type { DocumentBulkRequestDto } from '../../../shared/presentation/dtos/common.dto.js';
import type { TagSuggestionEntity } from '../../taxonomy/domain/taxonomy.entity.js';
import { toTagDto, toTagSuggestionDto } from '../../taxonomy/presentation/taxonomy.mapper.js';
import type { ListedDocumentPage } from '../application/list-documents.use-case.js';
import type { DocumentEntity } from '../domain/document.entity.js';

export function toDocumentBulkRequest(dto: DocumentBulkRequestDto): DocumentBulkRequest {
  const { ids, bulk } = dto;
  switch (bulk.action) {
    case 'addTag':
      return { ids, bulk: { action: 'addTag', tagId: bulk.tagId ?? '' } };
    case 'removeTag':
      return { ids, bulk: { action: 'removeTag', tagId: bulk.tagId ?? '' } };
    case 'setAbsender':
      return {
        ids,
        bulk: { action: 'setAbsender', value: bulk.value ?? null },
      };
    case 'setFolder':
      return { ids, bulk: { action: 'setFolder', folderId: bulk.folderId ?? null } };
    case 'delete':
      return { ids, bulk: { action: 'delete' } };
    default: {
      const _exhaustive: never = bulk.action;
      throw new Error(`Unsupported bulk action: ${String(_exhaustive)}`);
    }
  }
}

export function toDocumentListItemDto(
  entity: DocumentEntity,
  duplicateCandidateCount?: number,
  duplicateStack?: DocumentDuplicateStackSummaryDto | null
): DocumentListItemDto {
  return {
    id: entity.id,
    filename: entity.filename,
    title: entity.title,
    status: entity.status,
    extractionFailureReason: entity.extractionFailureReason ?? null,
    mimeType: entity.mimeType,
    fileSizeBytes: entity.fileSizeBytes,
    formatBadge: documentFormatBadge(entity.mimeType, entity.filename),
    previewAvailable: documentUsesPdfPreview(
      entity.mimeType,
      Boolean(entity.previewStorageKey?.trim())
    ),
    ingestSource: entity.ingestSource ?? null,
    ownerLine: entity.ownerLine?.trim() ? entity.ownerLine.trim() : null,
    documentDate: entity.documentDate ? entity.documentDate.toISOString().slice(0, 10) : null,
    folderId: entity.folderId ?? null,
    folder: entity.folder ? { id: entity.folder.id, name: entity.folder.name } : null,
    tags: entity.tags.map(toTagDto),
    duplicateCandidateCount,
    duplicateStack: duplicateStack ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function toDocumentListResponse(
  page: ListedDocumentPage,
  libraryUi?: { showDocumentOwnerLine: boolean }
): {
  items: DocumentListItemDto[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number | null;
  libraryUi?: { showDocumentOwnerLine: boolean };
} {
  return {
    items: page.items.map(({ entity, duplicateCandidateCount, duplicateStack }) =>
      toDocumentListItemDto(entity, duplicateCandidateCount, duplicateStack)
    ),
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
    total: page.total,
    libraryUi,
  };
}

export function toDocumentDto(
  entity: DocumentEntity,
  suggestions: TagSuggestionEntity[] = [],
  duplicateCandidateCount?: number,
  duplicateStack?: DocumentDuplicateStackSummaryDto | null,
  recognizedFieldAttempts?: RecognizedFieldExtractionAttemptDto[]
): DocumentDto {
  return {
    id: entity.id,
    filename: entity.filename,
    title: entity.title,
    status: entity.status,
    extractionFailureReason: entity.extractionFailureReason ?? null,
    mimeType: entity.mimeType,
    fileSizeBytes: entity.fileSizeBytes,
    formatBadge: documentFormatBadge(entity.mimeType, entity.filename),
    previewAvailable: documentUsesPdfPreview(
      entity.mimeType,
      Boolean(entity.previewStorageKey?.trim())
    ),
    ingestSource: entity.ingestSource ?? null,
    ownerLine: entity.ownerLine?.trim() ? entity.ownerLine.trim() : null,
    documentDate: entity.documentDate ? entity.documentDate.toISOString().slice(0, 10) : null,
    notes: entity.notes ?? null,
    folderId: entity.folderId ?? null,
    folder: entity.folder ? { id: entity.folder.id, name: entity.folder.name } : null,
    tags: entity.tags.map(toTagDto),
    tagSuggestions: suggestions.map(toTagSuggestionDto),
    duplicateCandidateCount,
    duplicateStack: duplicateStack ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    extraction: entity.extraction,
    recognizedFieldAttempts:
      recognizedFieldAttempts && recognizedFieldAttempts.length > 0
        ? recognizedFieldAttempts
        : undefined,
  };
}
