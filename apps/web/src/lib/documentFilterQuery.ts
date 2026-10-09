// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TFunction } from 'i18next';
import type { DocumentListQuery, DocumentStatus, TagDto } from '@docuvate/contracts';
import {
  parseFilterTokenValue,
  quoteFilterValueIfNeeded,
  tokenizeDocumentFilterQuery,
} from './documentFilterQueryLanguage.js';

export type LibraryFilterFields = Pick<
  DocumentListQuery,
  'inbox' | 'tagIds' | 'status' | 'folderId' | 'withoutNonInboxLabel'
> & {
  q?: string;
};

type ParsedFieldsInternal = Partial<LibraryFilterFields> & {
  labelNames?: string[];
};

export type DocumentFilterParseIssue = {
  token: string;
  messageKey: 'library.filter.parseUnknownKey' | 'library.filter.parseUnknownValue';
  detail?: string;
};

export type DocumentFilterParseResult = {
  fields: LibraryFilterFields;
  issues: DocumentFilterParseIssue[];
};

const STATUS_ALIASES: Record<string, DocumentStatus> = {
  ready: 'ready',
  bereit: 'ready',
  extracting: 'extracting',
  extraction: 'extracting',
  extraktion: 'extracting',
  queued: 'queued',
  queue: 'queued',
  warteschlange: 'queued',
  uploaded: 'uploaded',
  hochgeladen: 'uploaded',
  failed: 'failed',
  error: 'failed',
  fehler: 'failed',
};

export { tokenizeDocumentFilterQuery } from './documentFilterQueryLanguage.js';

function parseInboxValue(raw: string): boolean | null {
  const v = raw.toLowerCase();
  if (v === 'inbox' || v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no' || v === 'all') return false;
  return null;
}

export function parseDocumentFilterQuery(input: string): {
  fields: ParsedFieldsInternal;
  issues: DocumentFilterParseIssue[];
} {
  const fields: ParsedFieldsInternal = {};
  const labelNames: string[] = [];
  const freeText: string[] = [];
  const issues: DocumentFilterParseIssue[] = [];

  for (const token of tokenizeDocumentFilterQuery(input)) {
    if (!token) continue;
    const colon = token.indexOf(':');
    if (colon <= 0) {
      freeText.push(parseFilterTokenValue(token));
      continue;
    }
    const key = token.slice(0, colon).toLowerCase();
    const value = parseFilterTokenValue(token.slice(colon + 1));
    if (!value) {
      issues.push({
        token,
        messageKey: 'library.filter.parseUnknownValue',
        detail: key,
      });
      continue;
    }

    switch (key) {
      case 'in':
      case 'is': {
        const inbox = parseInboxValue(value);
        if (inbox === null) {
          issues.push({
            token,
            messageKey: 'library.filter.parseUnknownValue',
            detail: value,
          });
        } else {
          fields.inbox = inbox;
        }
        break;
      }
      case 'label':
        if (value.toLowerCase() === 'none') {
          fields.withoutNonInboxLabel = true;
        } else {
          labelNames.push(value);
        }
        break;
      case 'status': {
        const status = STATUS_ALIASES[value.toLowerCase()];
        if (!status) {
          issues.push({
            token,
            messageKey: 'library.filter.parseUnknownValue',
            detail: value,
          });
        } else {
          fields.status = status;
        }
        break;
      }
      case 'title':
      case 'q':
        freeText.push(value);
        break;
      case 'folder':
        issues.push({
          token,
          messageKey: 'library.filter.parseUnknownKey',
          detail: 'folder',
        });
        break;
      default:
        issues.push({
          token,
          messageKey: 'library.filter.parseUnknownKey',
          detail: key,
        });
    }
  }

  if (labelNames.length > 0) fields.labelNames = labelNames;
  const q = freeText.join(' ').trim();
  if (q) fields.q = q;

  return { fields, issues };
}

function tagNameIndex(tags: TagDto[]): Map<string, TagDto> {
  const map = new Map<string, TagDto>();
  for (const tag of tags) {
    map.set(tag.name.toLowerCase(), tag);
  }
  return map;
}

export function resolveDocumentFilterFields(
  parsed: ReturnType<typeof parseDocumentFilterQuery>,
  tags: TagDto[]
): DocumentFilterParseResult {
  const byName = tagNameIndex(tags);
  const tagIds: string[] = [];
  const issues = [...parsed.issues];
  for (const name of parsed.fields.labelNames ?? []) {
    const match = byName.get(name.toLowerCase());
    if (!match) {
      issues.push({
        token: `label:${name}`,
        messageKey: 'library.filter.parseUnknownValue',
        detail: name,
      });
    } else if (!tagIds.includes(match.id)) {
      tagIds.push(match.id);
    }
  }

  const { labelNames: _unusedLabelNames, ...rest } = parsed.fields;
  void _unusedLabelNames;
  return {
    fields: {
      ...rest,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
    },
    issues,
  };
}

/** Human-readable filter string for the shell search field (keeps parseable tokens internally). */
export function formatFilterQueryForDisplay(raw: string, t: TFunction): string {
  return raw.replace(/\blabel:none\b/gi, t('library.filter.withoutLabel'));
}

export function normalizeFilterQueryForSubmit(raw: string, t: TFunction): string {
  const label = t('library.filter.withoutLabel');
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return raw.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), 'label:none');
}

export function serializeDocumentFilterQuery(
  filters: DocumentListQuery,
  query: string,
  tags: TagDto[]
): string {
  const parts: string[] = [];
  if (filters.inbox) parts.push('in:inbox');
  if (filters.withoutNonInboxLabel) parts.push('label:none');

  const tagById = new Map(tags.map((t) => [t.id, t] as const));
  const tagIds = filters.tagIds ?? (filters.tagId ? [filters.tagId] : []);
  for (const id of tagIds) {
    const tag = tagById.get(id);
    if (tag) {
      parts.push(`label:${quoteFilterValueIfNeeded(tag.name)}`);
    }
  }

  if (filters.status) {
    parts.push(`status:${filters.status === 'failed' ? 'error' : filters.status}`);
  }

  const q = (query || filters.q || '').trim();
  if (q) {
    parts.push(quoteFilterValueIfNeeded(q));
  }

  return parts.join(' ');
}
