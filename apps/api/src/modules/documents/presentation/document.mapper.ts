import type { DocumentDto, DocumentDuplicateStackSummaryDto } from '@docuvate/contracts';
import {
  toCorrespondentDto,
  toTagDto,
  toTagSuggestionDto,
} from '../../taxonomy/presentation/taxonomy.mapper.js';
import type { TagSuggestionEntity } from '../../taxonomy/domain/taxonomy.entity.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import type { ListedDocument } from '../application/list-documents.use-case.js';

export function toDocumentListResponse(docs: ListedDocument[]): { items: DocumentDto[] } {
  return {
    items: docs.map(({ entity, duplicateCandidateCount, duplicateStack }) =>
      toDocumentDto(entity, [], duplicateCandidateCount, duplicateStack)
    ),
  };
}

export function toDocumentDto(
  entity: DocumentEntity,
  suggestions: TagSuggestionEntity[] = [],
  duplicateCandidateCount?: number,
  duplicateStack?: DocumentDuplicateStackSummaryDto | null
): DocumentDto {
  return {
    id: entity.id,
    filename: entity.filename,
    title: entity.title,
    status: entity.status,
    mimeType: entity.mimeType,
    ingestSource: entity.ingestSource ?? null,
    documentDate: entity.documentDate ? entity.documentDate.toISOString().slice(0, 10) : null,
    notes: entity.notes ?? null,
    folderId: entity.folderId ?? null,
    mappeId: entity.mappeId ?? null,
    folder: entity.folder ? { id: entity.folder.id, name: entity.folder.name } : null,
    correspondent: entity.correspondent ? toCorrespondentDto(entity.correspondent) : null,
    tags: entity.tags.map(toTagDto),
    tagSuggestions: suggestions.map(toTagSuggestionDto),
    duplicateCandidateCount,
    duplicateStack: duplicateStack ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    extraction: entity.extraction,
  };
}
