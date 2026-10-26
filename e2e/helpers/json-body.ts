// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Expected JSON object: ${label}`);
  }
  return value;
}

export interface DocumentListItem {
  id: string;
  mimeType?: string;
}

export function parseDocumentListBody(value: unknown): DocumentListItem[] {
  const root = requireRecord(value, 'document list');
  const itemsRaw = root.items;
  if (!Array.isArray(itemsRaw)) {
    throw new Error('Expected document list items array');
  }
  const items: DocumentListItem[] = [];
  for (const entry of itemsRaw) {
    const row = requireRecord(entry, 'document list item');
    const id = parseString(row.id);
    if (!id) {
      continue;
    }
    const mimeType = parseString(row.mimeType);
    items.push(mimeType ? { id, mimeType } : { id });
  }
  return items;
}

export interface FolderListItem {
  id: string;
  name: string;
  parentId: string | null;
}

function parseNullableUuid(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = parseString(value);
  return parsed.length > 0 ? parsed : null;
}

export function parseFolderBody(value: unknown): FolderListItem {
  const root = requireRecord(value, 'folder');
  const id = parseString(root.id);
  const name = parseString(root.name);
  if (!id || !name) {
    throw new Error('Invalid folder response');
  }
  return {
    id,
    name,
    parentId: parseNullableUuid(root.parentId),
  };
}

export function parseFolderListBody(value: unknown): FolderListItem[] {
  const root = requireRecord(value, 'folder list');
  const itemsRaw = root.items;
  if (!Array.isArray(itemsRaw)) {
    throw new Error('Expected folder list items array');
  }
  return itemsRaw.map((entry) => parseFolderBody(entry));
}

export interface AcceptLabelRecommendationBody {
  tagId: string;
  action: string;
}

export function parseAcceptLabelRecommendationBody(value: unknown): AcceptLabelRecommendationBody {
  const root = requireRecord(value, 'accept label recommendation');
  const tagId = parseString(root.tagId);
  const action = parseString(root.action);
  if (!tagId || !action) {
    throw new Error('Invalid accept label recommendation response');
  }
  return { tagId, action };
}

export interface LabelRecommendationListItem {
  kind: string;
}

export function parseLabelRecommendationListBody(value: unknown): LabelRecommendationListItem[] {
  const root = requireRecord(value, 'label recommendations');
  const itemsRaw = root.items;
  if (!Array.isArray(itemsRaw)) {
    throw new Error('Expected label recommendation items array');
  }
  const items: LabelRecommendationListItem[] = [];
  for (const entry of itemsRaw) {
    const row = requireRecord(entry, 'label recommendation item');
    items.push({ kind: parseString(row.kind) });
  }
  return items;
}
