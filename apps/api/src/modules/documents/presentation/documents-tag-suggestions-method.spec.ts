// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { MethodNotAllowedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { throwTagSuggestionsGetNotAllowed } from './tag-suggestions-get-not-allowed.js';

describe('tag-suggestions GET method guard', () => {
  it('rejects GET with 405 and Allow POST', () => {
    const header = vi.fn<(name: string, value: string) => void>();
    expect(() => throwTagSuggestionsGetNotAllowed({ header })).toThrow(MethodNotAllowedException);
    expect(header).toHaveBeenCalledWith('Allow', 'POST');
  });
});
