// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CursorListResponse } from '@docuvate/contracts';

import {
  encodeIdTiebreakerCursor,
  type IdTiebreakerCursorPayload,
} from './id-tiebreaker-cursor.js';

export function compareDescSortThenId(
  leftSort: string | number,
  leftId: string,
  rightSort: string | number,
  rightId: string
): number {
  if (leftSort > rightSort) return -1;
  if (leftSort < rightSort) return 1;
  if (leftId > rightId) return -1;
  if (leftId < rightId) return 1;
  return 0;
}

export function compareAscSortThenId(
  leftSort: string | number,
  leftId: string,
  rightSort: string | number,
  rightId: string
): number {
  if (leftSort < rightSort) return -1;
  if (leftSort > rightSort) return 1;
  if (leftId < rightId) return -1;
  if (leftId > rightId) return 1;
  return 0;
}

export function sliceSortedCursorPage<T>(input: {
  sorted: T[];
  limit: number;
  cursor: IdTiebreakerCursorPayload | null;
  getSortValue: (item: T) => string | number;
  getId: (item: T) => string;
  order: 'asc' | 'desc';
  includeTotal: boolean;
}): CursorListResponse<T> {
  const compare =
    input.order === 'asc' ? compareAscSortThenId : compareDescSortThenId;
  let startIndex = 0;
  if (input.cursor) {
    const cursorSort = input.cursor.sortValue;
    if (cursorSort === undefined) {
      throw new Error('Cursor missing sortValue');
    }
    startIndex = input.sorted.findIndex((item) => {
      const cmp = compare(
        input.getSortValue(item),
        input.getId(item),
        cursorSort,
        input.cursor?.id ?? ''
      );
      return cmp > 0;
    });
    if (startIndex < 0) {
      startIndex = input.sorted.length;
    }
  }

  const pageSize = input.limit;
  const slice = input.sorted.slice(startIndex, startIndex + pageSize + 1);
  const hasMore = slice.length > pageSize;
  const items = hasMore ? slice.slice(0, pageSize) : slice;

  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1];
    if (last) {
      const payload: IdTiebreakerCursorPayload = {
        v: 1,
        id: input.getId(last),
        sortValue: input.getSortValue(last),
      };
      nextCursor = encodeIdTiebreakerCursor(payload);
    }
  }

  return {
    items,
    hasMore,
    nextCursor,
    total: input.includeTotal ? input.sorted.length : null,
  };
}
