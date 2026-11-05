// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { readLibrarySortFromSearchParams, writeLibrarySortToSearchParams } from './librarySortUrl';

describe('librarySortUrl', () => {
  it('reads sort and order from search params with defaults', () => {
    const params = new URLSearchParams('sort=title&order=asc');
    expect(readLibrarySortFromSearchParams(params)).toEqual({ sort: 'title', order: 'asc' });
    expect(readLibrarySortFromSearchParams(new URLSearchParams())).toEqual({
      sort: 'updatedAt',
      order: 'desc',
    });
  });

  it('omits default sort from the URL and writes non-defaults', () => {
    const params = new URLSearchParams('filter=inbox:true');
    writeLibrarySortToSearchParams(params, 'updatedAt', 'desc');
    expect(params.toString()).toBe('filter=inbox%3Atrue');
    writeLibrarySortToSearchParams(params, 'title', 'asc');
    expect(params.get('sort')).toBe('title');
    expect(params.get('order')).toBe('asc');
  });
});
