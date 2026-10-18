// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField, TagCustomFieldDefinitionDto, TagDto } from '@docuvate/contracts';

const LABEL_STORAGE_PREFIX = /^label:([0-9a-f-]{36}):(.+)$/i;
const GLOBAL_STORAGE_PREFIX = /^global:([a-z0-9_]+)$/i;

export function parseLabelFieldKey(key: string): { tagId: string; fieldKey: string } | null {
  const match = LABEL_STORAGE_PREFIX.exec(key);
  if (!match) {
    return null;
  }
  return { tagId: match[1], fieldKey: match[2] };
}

export function parseGlobalFieldKey(key: string): string | null {
  const match = GLOBAL_STORAGE_PREFIX.exec(key);
  return match ? match[1] : null;
}

export function labelFieldDisplayName(
  field: ExtractedField,
  tags: TagDto[],
  defsByTagId: Map<string, TagCustomFieldDefinitionDto[]>,
  globalDefs = new Map<string, string>()
): string {
  const globalKey = parseGlobalFieldKey(field.key);
  if (globalKey) {
    return globalDefs.get(globalKey) ?? globalKey;
  }

  const parsed = field.tagId
    ? { tagId: field.tagId, fieldKey: parseLabelFieldKey(field.key)?.fieldKey ?? field.key }
    : parseLabelFieldKey(field.key);
  if (!parsed) {
    return field.key;
  }
  const tag = tags.find((t) => t.id === parsed.tagId);
  const def = (defsByTagId.get(parsed.tagId) ?? tag?.customFields ?? []).find(
    (d) => d.key === parsed.fieldKey
  );
  const fieldLabel = def?.label ?? parsed.fieldKey;
  return tag ? `${tag.name} · ${fieldLabel}` : fieldLabel;
}

export function buildGlobalFieldLabelMap(
  defs: { key: string; label: string }[]
): Map<string, string> {
  return new Map(defs.map((d) => [d.key, d.label]));
}

export function buildCustomFieldDefMap(tags: TagDto[]): Map<string, TagCustomFieldDefinitionDto[]> {
  const map = new Map<string, TagCustomFieldDefinitionDto[]>();
  for (const tag of tags) {
    if (tag.customFields?.length) {
      map.set(tag.id, tag.customFields);
    }
  }
  return map;
}
