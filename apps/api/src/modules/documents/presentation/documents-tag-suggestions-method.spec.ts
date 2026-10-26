// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { MethodNotAllowedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { DocumentsController } from './documents.controller.js';

describe('DocumentsController tag-suggestions HTTP methods', () => {
  it('rejects GET with 405', () => {
    expect(() => DocumentsController.prototype.tagSuggestionsGetNotAllowed()).toThrow(
      MethodNotAllowedException
    );
  });
});
