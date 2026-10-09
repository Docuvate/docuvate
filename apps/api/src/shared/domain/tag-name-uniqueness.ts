// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ValidationError } from './errors.js';
import { namesAreNearDuplicate, normalizeLabelKey } from './label-name-similarity.js';

export type TagNameRef = { id: string; name: string };

export function findNearDuplicateTag(
  name: string,
  existing: TagNameRef[],
  editingTagId?: string
): TagNameRef | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  for (const tag of existing) {
    if (editingTagId && tag.id === editingTagId) {
      continue;
    }
    if (normalizeLabelKey(tag.name) === normalizeLabelKey(trimmed)) {
      return tag;
    }
    if (namesAreNearDuplicate(tag.name, trimmed)) {
      return tag;
    }
  }
  return null;
}

export function assertTagNameNotNearDuplicate(
  name: string,
  existing: TagNameRef[],
  editingTagId?: string
): void {
  const duplicate = findNearDuplicateTag(name, existing, editingTagId);
  if (!duplicate) {
    return;
  }
  const trimmed = name.trim();
  if (normalizeLabelKey(duplicate.name) === normalizeLabelKey(trimmed)) {
    throw new ValidationError(
      `Label „${trimmed}" existiert bereits als „${duplicate.name}". Bitte das vorhandene Label verwenden.`
    );
  }
  throw new ValidationError(
    `Sehr ähnlich zu vorhandenem Label „${duplicate.name}". Bitte zusammenführen oder umbenennen statt ein neues Label anzulegen.`
  );
}
