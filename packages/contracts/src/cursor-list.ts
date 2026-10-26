// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export const CURSOR_LIST_DEFAULT_LIMIT = 50;
export const CURSOR_LIST_MAX_LIMIT = 200;

export interface CursorListQuery {
  limit?: number;
  cursor?: string;
}

export interface CursorListResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  /** Present on the first page when no `cursor` was sent. */
  total: number | null;
}
