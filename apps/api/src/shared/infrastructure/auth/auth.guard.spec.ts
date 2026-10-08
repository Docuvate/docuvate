import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from './auth.guard.js';
import { ServiceApiKeyRegistry } from './service-api-key.registry.js';

vi.mock('./better-auth.config.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => null),
    },
  },
}));

function mockExecutionContext(): ExecutionContext {
  class ProtectedController {}
  const handler = function protectedHandler() {};
  return {
    getHandler: () => handler,
    getClass: () => ProtectedController,
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
    }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard(new ServiceApiKeyRegistry(), new Reflector());
  });

  it('throws UnauthorizedException when route is not public and there is no session or API key', async () => {
    await expect(guard.canActivate(mockExecutionContext())).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });
});
