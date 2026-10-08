import type {
  DocumentListQuery,
  DocumentSortField,
  DocumentStatus,
  SortOrder,
} from '@docuvate/contracts';

export function buildDocumentListQuery(input: {
  q?: string;
  status?: DocumentStatus;
  tagId?: string;
  tags?: string;
  correspondentId?: string;
  folderId?: string;
  mappeId?: string;
  unfiled?: string;
  inbox?: string;
  sort?: DocumentSortField;
  order?: SortOrder;
}): DocumentListQuery {
  const tagIds = input.tags
    ? input.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  return {
    q: input.q,
    status: input.status,
    tagId: input.tagId,
    tagIds,
    correspondentId: input.correspondentId,
    folderId: input.folderId,
    mappeId: input.mappeId,
    unfiled: input.unfiled === 'true' || input.unfiled === '1',
    inbox: input.inbox === 'true' || input.inbox === '1',
    sort: input.sort,
    order: input.order,
  };
}
