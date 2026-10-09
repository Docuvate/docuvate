// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CustomFieldType } from '@docuvate/contracts';

export interface TagCustomFieldEntity {
  id: string;
  tagId: string;
  userId: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
}

export function labelFieldStorageKey(tagId: string, fieldKey: string): string {
  return `label:${tagId}:${fieldKey}`;
}

export function parseLabelFieldStorageKey(
  storageKey: string
): { tagId: string; fieldKey: string } | null {
  const match = /^label:([0-9a-f-]{36}):(.+)$/i.exec(storageKey);
  if (!match) {
    return null;
  }
  return { tagId: match[1]!, fieldKey: match[2]! };
}
