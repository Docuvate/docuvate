import { describe, expect, it } from 'vitest';
import { ForbiddenError } from '../../domain/errors.js';
import { AdminGuard } from './admin.guard.js';
import type { AuthenticatedRequest } from './auth.guard.js';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('denies members', () => {
    const req = {
      authSubject: {
        kind: 'user' as const,
        id: 'u1',
        tenantId: 'u1',
        roles: ['member'],
        claims: ['document:*'],
      },
    } as unknown as AuthenticatedRequest;
    expect(() =>
      guard.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as never)
    ).toThrow(ForbiddenError);
  });

  it('allows administrators', () => {
    const req = {
      authSubject: {
        kind: 'user' as const,
        id: 'u1',
        tenantId: 'u1',
        roles: ['admin', 'member'],
        claims: ['document:*', 'admin:*'],
      },
    } as unknown as AuthenticatedRequest;
    expect(
      guard.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as never)
    ).toBe(true);
  });
});
