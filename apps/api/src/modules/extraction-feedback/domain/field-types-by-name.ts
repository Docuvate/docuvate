// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { canonicalFieldName, type CustomFieldType } from '@docuvate/contracts';

/** Declared type per canonical field name; names declared with conflicting types map to null. */
export function fieldTypesByName(
  definitions: readonly { key: string; fieldType: CustomFieldType }[]
): Map<string, CustomFieldType | null> {
  const types = new Map<string, CustomFieldType | null>();
  for (const definition of definitions) {
    const name = canonicalFieldName(definition.key);
    const known = types.get(name);
    types.set(
      name,
      known === undefined || known === definition.fieldType ? definition.fieldType : null
    );
  }
  return types;
}
