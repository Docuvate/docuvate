// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { InstallationMembershipService } from '../../../modules/auth/infrastructure/installation-membership.service.js';
import { AuthGuard } from './auth.guard.js';
import { httpExecutionContext } from './nest-execution-context.spec-util.js';
import { ServiceApiKeyRegistry } from './service-api-key.registry.js';

describe('AuthGuard', () => {
  it('rejects service API keys bound to a suspended user', async () => {
    const apiKeys = new ServiceApiKeyRegistry();
    vi.spyOn(apiKeys, 'resolve').mockReturnValue({
      sessionUser: { id: 'user-1', email: 'u@example.com', name: 'U' },
      subject: {
        kind: 'service',
        id: 'svc',
        tenantId: 'user-1',
        roles: ['integrator'],
        claims: ['document:read'],
      },
    });
    const installationMembership = {
      loadForUser: vi.fn().mockResolvedValue({
        userId: 'user-1',
        dbRole: 'installation_member',
        suspended: true,
        suspensionReason: 'test',
      }),
      instanceRoleFor: vi.fn(),
    };
    const reflector = { getAllAndOverride: vi.fn(() => false) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: AuthGuard,
          useFactory: (
            registry: ServiceApiKeyRegistry,
            reflectorService: Reflector,
            membership: InstallationMembershipService
          ) => new AuthGuard(registry, reflectorService, membership),
          inject: [ServiceApiKeyRegistry, Reflector, InstallationMembershipService],
        },
        { provide: ServiceApiKeyRegistry, useValue: apiKeys },
        { provide: Reflector, useValue: reflector },
        { provide: InstallationMembershipService, useValue: installationMembership },
      ],
    }).compile();
    const guard = moduleRef.get(AuthGuard);

    const context = httpExecutionContext({
      headers: { 'x-docuvate-api-key': 'secret' },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
