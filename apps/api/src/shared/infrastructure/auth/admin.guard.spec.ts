// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { ForbiddenError } from '../../domain/errors.js';
import { AdminGuard } from './admin.guard.js';
import { httpExecutionContext } from './nest-execution-context.spec-util.js';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('denies members', () => {
    const context = httpExecutionContext({
      authSubject: {
        kind: 'user',
        id: 'u1',
        tenantId: 'u1',
        roles: ['member'],
        claims: ['document:*'],
      },
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenError);
  });

  it('allows administrators', () => {
    const context = httpExecutionContext({
      authSubject: {
        kind: 'user',
        id: 'u1',
        tenantId: 'u1',
        roles: ['admin', 'member'],
        claims: ['document:*', 'admin:*'],
      },
    });
    expect(guard.canActivate(context)).toBe(true);
  });
});
