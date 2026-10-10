// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.guard.js';

class EmptyHttpController {}

function httpHandler(): void {
  return undefined;
}

function httpNext(): void {
  return undefined;
}

export function httpExecutionContext(
  request: Partial<Pick<AuthenticatedRequest, 'authSubject' | 'headers'>>
): ExecutionContext {
  return {
    getClass: () => EmptyHttpController,
    getHandler: () => httpHandler,
    getArgs: () => [request],
    getArgByIndex: (index: number) => (index === 0 ? request : undefined),
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => httpNext,
    }),
    switchToRpc: () => ({
      getData: () => undefined,
      getContext: () => undefined,
    }),
    switchToWs: () => ({
      getData: () => undefined,
      getClient: () => undefined,
      getPattern: () => '',
    }),
    getType: () => 'http',
  } as unknown as ExecutionContext;
}
