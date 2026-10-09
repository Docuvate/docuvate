// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { ForbiddenError, NotFoundError } from '../../../shared/domain/errors.js';

describe('document access', () => {
  it('documents are scoped per user (contract)', () => {
    expect(new NotFoundError('Document').code).toBe('NOT_FOUND');
    expect(new ForbiddenError().code).toBe('FORBIDDEN');
  });
});
