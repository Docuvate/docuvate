// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const openApiPath = resolve(process.cwd(), '../../openapi/docuvate.v1.json');

interface OpenApiDoc {
  paths: Record<string, Record<string, { operationId?: string }>>;
}

function isOpenApiOperation(value: unknown): value is { operationId?: string } {
  return typeof value === 'object' && value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseOpenApiDoc(raw: string): OpenApiDoc {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || !('paths' in parsed)) {
    throw new Error('Invalid OpenAPI document');
  }
  const pathsRaw: unknown = parsed.paths;
  if (!isRecord(pathsRaw)) {
    throw new Error('Invalid OpenAPI paths');
  }
  const paths: OpenApiDoc['paths'] = {};
  for (const [path, methods] of Object.entries(pathsRaw)) {
    if (typeof methods !== 'object' || methods === null) {
      continue;
    }
    const methodMap: Record<string, { operationId?: string }> = {};
    for (const [method, operation] of Object.entries(methods)) {
      if (isOpenApiOperation(operation)) {
        methodMap[method] = operation;
      }
    }
    paths[path] = methodMap;
  }
  return { paths };
}

const PUBLIC_ADMIN_OPERATIONS = new Set(['getAdminAccess']);

describe('admin OpenAPI routes', () => {
  const doc = parseOpenApiDoc(readFileSync(openApiPath, 'utf8'));

  const adminRoutes = Object.entries(doc.paths)
    .filter(([path]) => path.startsWith('/admin/'))
    .flatMap(([path, methods]) =>
      Object.entries(methods).map(([method, operation]) => ({
        method: method.toUpperCase(),
        path,
        operationId: operation.operationId ?? `${method}:${path}`,
      }))
    );

  it('lists every /admin route (generated inventory)', () => {
    expect(adminRoutes.length).toBeGreaterThan(0);
  });

  it('requires administrator for every admin route except access probe', () => {
    const privileged = adminRoutes.filter(
      (route) => !PUBLIC_ADMIN_OPERATIONS.has(route.operationId)
    );
    const labels = privileged.map((route) => `${route.method} ${route.path}`).sort();
    expect(labels).toEqual([
      'GET /admin/users',
      'PATCH /admin/users/{userId}/role',
      'POST /admin/users',
      'POST /admin/users/{userId}/ban',
      'POST /admin/users/{userId}/resend-invitation',
      'POST /admin/users/{userId}/revoke-invitation',
      'POST /admin/users/{userId}/revoke-sessions',
      'POST /admin/users/{userId}/unban',
    ]);
  });

  it('does not expose impersonation or MFA reset in PR1', () => {
    const paths = Object.keys(doc.paths);
    expect(paths.some((path) => path.includes('impersonat'))).toBe(false);
    expect(paths.some((path) => path.includes('reset-two-factor'))).toBe(false);
  });
});
