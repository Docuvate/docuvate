// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard.js';
import type { InstallationMembershipService } from '../../../modules/auth/infrastructure/installation-membership.service.js';
import { ServiceApiKeyRegistry } from './service-api-key.registry.js';

describe('AuthGuard', () => {
  it('rejects service API keys bound to a suspended user', async () => {
    const apiKeys = {
      resolve: () => ({
        sessionUser: { id: 'user-1', email: 'u@example.com', name: 'U' },
        subject: {
          kind: 'service' as const,
          id: 'svc',
          tenantId: 'user-1',
          roles: ['integrator'],
          claims: ['document:read'],
        },
      }),
    } as unknown as ServiceApiKeyRegistry;
    const installationMembership = {
      loadForUser: vi.fn().mockResolvedValue({
        userId: 'user-1',
        dbRole: 'installation_member',
        suspended: true,
        suspensionReason: 'test',
      }),
    } as unknown as InstallationMembershipService;

    const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
    const guard = new AuthGuard(apiKeys, reflector, installationMembership);
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-docuvate-api-key': 'secret' } }),
      }),
    };

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
