// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery, DocumentSortField, SortOrder } from '@docuvate/contracts';

import type { DocumentListCursorPayload } from './document-list-cursor.js';

export interface DocumentListKeysetSql {
  conditionSql: string;
  params: unknown[];
}

export function resolvedDocumentListSort(filters: DocumentListQuery): {
  sortField: DocumentSortField;
  order: SortOrder;
} {
  return {
    sortField: filters.sort ?? 'updatedAt',
    order: filters.order === 'asc' ? 'asc' : 'desc',
  };
}

export function buildDocumentListOrderBy(sortField: DocumentSortField, order: SortOrder): string {
  const dir = order === 'asc' ? 'ASC' : 'DESC';
  const sortColumn: Record<DocumentSortField, string> = {
    updatedAt: 'd.updated_at',
    createdAt: 'd.created_at',
    title: 'd.title',
    documentDate: 'd.document_date',
  };
  const col = sortColumn[sortField];
  const nulls = sortField === 'documentDate' ? ' NULLS LAST' : '';
  return `${col} ${dir}${nulls}, d.id ${dir}`;
}

function compareOperator(order: SortOrder): '<' | '>' {
  return order === 'asc' ? '>' : '<';
}

function timestampKeyset(
  column: 'd.updated_at' | 'd.created_at',
  order: SortOrder,
  cursor: DocumentListCursorPayload,
  timestamp: string,
  startIndex: number
): DocumentListKeysetSql {
  const op = compareOperator(order);
  const tParam = `$${String(startIndex)}`;
  const idParam = `$${String(startIndex + 1)}`;
  return {
    conditionSql: `(${column}, d.id) ${op} (${tParam}::timestamptz, ${idParam}::uuid)`,
    params: [timestamp, cursor.id],
  };
}

function titleKeyset(
  order: SortOrder,
  cursor: DocumentListCursorPayload,
  startIndex: number
): DocumentListKeysetSql {
  const title = cursor.title ?? '';
  const op = compareOperator(order);
  const titleParam = `$${String(startIndex)}`;
  const idParam = `$${String(startIndex + 1)}`;
  return {
    conditionSql: `(d.title, d.id) ${op} (${titleParam}, ${idParam}::uuid)`,
    params: [title, cursor.id],
  };
}

function documentDateKeyset(
  order: SortOrder,
  cursor: DocumentListCursorPayload,
  startIndex: number
): DocumentListKeysetSql {
  const op = compareOperator(order);
  const idParam = `$${String(startIndex + 1)}`;
  const dateParam = `$${String(startIndex)}`;
  const cursorDate = cursor.documentDate;
  if (order === 'desc') {
    if (cursorDate != null) {
      return {
        conditionSql: `(
          (d.document_date IS NOT DISTINCT FROM ${dateParam}::date AND d.id ${op} ${idParam}::uuid)
          OR (d.document_date < ${dateParam}::date)
          OR d.document_date IS NULL
        )`,
        params: [cursorDate, cursor.id],
      };
    }
    const onlyIdParam = `$${String(startIndex)}`;
    return {
      conditionSql: `(d.document_date IS NULL AND d.id ${op} ${onlyIdParam}::uuid)`,
      params: [cursor.id],
    };
  }
  if (cursorDate != null) {
    return {
      conditionSql: `(
        (d.document_date IS NOT DISTINCT FROM ${dateParam}::date AND d.id ${op} ${idParam}::uuid)
        OR (d.document_date > ${dateParam}::date)
        OR (d.document_date IS NULL)
      )`,
      params: [cursorDate, cursor.id],
    };
  }
  const onlyIdParam = `$${String(startIndex)}`;
  return {
    conditionSql: `(d.document_date IS NULL AND d.id ${op} ${onlyIdParam}::uuid)`,
    params: [cursor.id],
  };
}

export function buildDocumentListKeysetSql(
  sortField: DocumentSortField,
  order: SortOrder,
  cursor: DocumentListCursorPayload,
  paramIndexStart: number
): DocumentListKeysetSql {
  switch (sortField) {
    case 'updatedAt': {
      const updatedAt = cursor.updatedAt;
      if (!updatedAt) {
        throw new Error('Cursor missing updatedAt');
      }
      return timestampKeyset('d.updated_at', order, cursor, updatedAt, paramIndexStart);
    }
    case 'createdAt': {
      const createdAt = cursor.createdAt;
      if (!createdAt) {
        throw new Error('Cursor missing createdAt');
      }
      return timestampKeyset('d.created_at', order, cursor, createdAt, paramIndexStart);
    }
    case 'title':
      return titleKeyset(order, cursor, paramIndexStart);
    case 'documentDate':
      return documentDateKeyset(order, cursor, paramIndexStart);
    default: {
      const _exhaustive: never = sortField;
      throw new Error(`Unsupported sort field: ${String(_exhaustive)}`);
    }
  }
}

export function cursorPayloadFromDocumentRow(
  sortField: DocumentSortField,
  order: SortOrder,
  row: {
    id: string;
    updated_at: Date;
    created_at: Date;
    title: string;
    document_date: Date | null;
  }
): DocumentListCursorPayload {
  const base = {
    v: 1 as const,
    sort: sortField,
    order,
    id: row.id,
  };
  switch (sortField) {
    case 'updatedAt':
      return { ...base, updatedAt: row.updated_at.toISOString() };
    case 'createdAt':
      return { ...base, createdAt: row.created_at.toISOString() };
    case 'title':
      return { ...base, title: row.title };
    case 'documentDate':
      return {
        ...base,
        documentDate: row.document_date ? row.document_date.toISOString().slice(0, 10) : null,
      };
    default: {
      const _exhaustive: never = sortField;
      throw new Error(`Unsupported sort field: ${String(_exhaustive)}`);
    }
  }
}
