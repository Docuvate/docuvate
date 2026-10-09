// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagCustomFieldDefinitionDto } from '@docuvate/contracts';
import type { TagCustomFieldEntity } from '../domain/tag-custom-field.entity.js';

export function toTagCustomFieldDto(entity: TagCustomFieldEntity): TagCustomFieldDefinitionDto {
  return {
    id: entity.id,
    tagId: entity.tagId,
    key: entity.key,
    label: entity.label,
    fieldType: entity.fieldType,
    sortOrder: entity.sortOrder,
  };
}
