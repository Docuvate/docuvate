// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { documentListQueryKey } from './documentListQueryKey';

describe('documentListQueryKey', () => {
  it('is stable for equivalent filter objects', () => {
    const a = documentListQueryKey({
      sort: 'updatedAt',
      order: 'desc',
      tagIds: ['b', 'a'],
      q: 'invoice',
    });
    const b = documentListQueryKey({
      q: 'invoice',
      tagIds: ['a', 'b'],
      order: 'desc',
      sort: 'updatedAt',
    });
    expect(a).toEqual(b);
  });

  it('changes when sort changes', () => {
    const a = documentListQueryKey({ sort: 'updatedAt', order: 'desc' });
    const b = documentListQueryKey({ sort: 'title', order: 'desc' });
    expect(a).not.toEqual(b);
  });
});
