// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { MethodNotAllowedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { DocumentsController } from './documents.controller.js';

describe('DocumentsController tag-suggestions HTTP methods', () => {
  it('rejects GET with 405 and Allow POST', () => {
    const reply = { header: vi.fn() };
    expect(() =>
      DocumentsController.prototype.tagSuggestionsGetNotAllowed.call(
        {},
        reply as { header: (name: string, value: string) => void }
      )
    ).toThrow(MethodNotAllowedException);
    expect(reply.header).toHaveBeenCalledWith('Allow', 'POST');
  });
});
