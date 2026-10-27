// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  CURSOR_LIST_DEFAULT_LIMIT,
  CURSOR_LIST_MAX_LIMIT,
} from '@docuvate/contracts';

export function clampCursorListLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return CURSOR_LIST_DEFAULT_LIMIT;
  }
  const rounded = Math.floor(limit);
  if (!Number.isFinite(rounded) || rounded < 1) {
    return CURSOR_LIST_DEFAULT_LIMIT;
  }
  return Math.min(rounded, CURSOR_LIST_MAX_LIMIT);
}

export { CURSOR_LIST_DEFAULT_LIMIT, CURSOR_LIST_MAX_LIMIT };
