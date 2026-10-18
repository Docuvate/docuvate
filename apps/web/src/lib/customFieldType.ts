// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CustomFieldType } from '@docuvate/contracts';

const CUSTOM_FIELD_TYPES: CustomFieldType[] = ['text', 'date', 'number', 'currency'];

export function parseCustomFieldType(value: string): CustomFieldType {
  for (const fieldType of CUSTOM_FIELD_TYPES) {
    if (fieldType === value) {
      return fieldType;
    }
  }
  return 'text';
}
