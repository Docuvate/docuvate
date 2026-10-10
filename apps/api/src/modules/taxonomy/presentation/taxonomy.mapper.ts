// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CorrespondentDto, TagDto, TagSuggestionDto } from '@docuvate/contracts';

import type {
  CorrespondentEntity,
  TagEntity,
  TagSuggestionEntity,
} from '../domain/taxonomy.entity.js';

export function toTagDto(tag: TagEntity): TagDto {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color ?? undefined,
    isInbox: tag.isInbox,
    matchingAlgorithm: tag.matchingAlgorithm,
    match: tag.match,
    customFields: tag.customFields?.map((field) => ({
      id: field.id,
      tagId: field.tagId,
      key: field.key,
      label: field.label,
      fieldType: field.fieldType,
      sortOrder: field.sortOrder,
    })),
  };
}

export function toCorrespondentDto(c: CorrespondentEntity): CorrespondentDto {
  return {
    id: c.id,
    name: c.name,
    matchingAlgorithm: c.matchingAlgorithm,
    match: c.match,
  };
}

export function toTagSuggestionDto(entity: TagSuggestionEntity): TagSuggestionDto {
  return {
    tag: toTagDto(entity.tag),
    reason: entity.reason,
    confidence: entity.confidence,
    source: entity.source,
    decisionTier: entity.decisionTier,
  };
}
