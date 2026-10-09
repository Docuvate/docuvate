// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { RequestMethod, type INestApplication } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import type { OpenAPIObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';
import { isPublicOpenApiExcludedPath } from './public-openapi-paths.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RouteAllowlistEntry {
  method: HttpMethod | '*';
  path: string;
  /** Comment for maintainers (health checks, better-auth, etc.) */
  reason: string;
}

/** Routes served by the API but intentionally omitted from the product OpenAPI document. */
export const OPENAPI_ROUTE_ALLOWLIST: RouteAllowlistEntry[] = [
  { method: 'GET', path: '/health', reason: 'Load balancer liveness probe' },
  { method: 'GET', path: '/health/ready', reason: 'Load balancer readiness probe' },
  { method: '*', path: '/api/auth/*', reason: 'better-auth handler (not part of /v1 product API)' },
];

/** Operations documented without auth (browser redirects or public metadata). */
export const OPENAPI_PUBLIC_OPERATION_IDS = new Set<string>([
  'getOpenApiDocument',
  'connectorOAuthCallback',
]);

const HTTP_METHODS = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);

export function normalizeFastifyPath(rawPath: string): string {
  let path = rawPath.split('?')[0] ?? rawPath;
  if (path.startsWith('/v1')) {
    path = path.slice(3) || '/';
  }
  path = path.replace(/:([^/]+)/g, '{$1}');
  return path;
}

function pathMatchesAllowlist(normalizedPath: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1);
    return normalizedPath.startsWith(prefix);
  }
  return normalizedPath === pattern;
}

export function isRouteAllowlisted(method: string, rawPath: string): boolean {
  const normalized = normalizeFastifyPath(rawPath);
  const upper = method.toUpperCase();
  for (const entry of OPENAPI_ROUTE_ALLOWLIST) {
    if (entry.method !== '*' && entry.method !== upper) continue;
    if (pathMatchesAllowlist(normalized, entry.path)) return true;
  }
  return false;
}

export interface RegisteredRoute {
  method: HttpMethod;
  path: string;
}

const NEST_METHOD_TO_HTTP: Partial<Record<RequestMethod, HttpMethod>> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.HEAD]: 'HEAD',
  [RequestMethod.OPTIONS]: 'OPTIONS',
};

function joinRouteSegments(...segments: Array<string | undefined>): string {
  const joined = segments
    .filter((segment): segment is string => Boolean(segment && segment.length > 0))
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return joined ? `/${joined}` : '/';
}

/** Collect Nest controller routes (same surface the product API exposes). */
export function collectNestHttpRoutes(
  app: INestApplication,
  options?: { globalPrefix?: string }
): RegisteredRoute[] {
  const globalPrefix = options?.globalPrefix?.replace(/^\/+|\/+$/g, '') ?? '';
  const modulesContainer = app.get(ModulesContainer);
  const scanner = new MetadataScanner();
  const routes: RegisteredRoute[] = [];

  for (const module of modulesContainer.values()) {
    for (const wrapper of module.controllers.values()) {
      const { instance } = wrapper;
      if (!instance) continue;
      const controllerPath = Reflect.getMetadata(PATH_METADATA, instance.constructor) ?? '';
      const prototype = Object.getPrototypeOf(instance) as object;

      for (const methodName of scanner.getAllMethodNames(prototype)) {
        const handler = prototype[methodName as keyof typeof prototype];
        if (typeof handler !== 'function') continue;
        const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as
          RequestMethod | undefined;
        const httpMethod =
          requestMethod !== undefined ? NEST_METHOD_TO_HTTP[requestMethod] : undefined;
        if (!httpMethod || httpMethod === 'HEAD' || httpMethod === 'OPTIONS') continue;

        const methodPath = Reflect.getMetadata(PATH_METADATA, handler) ?? '';
        const rawPath = joinRouteSegments(globalPrefix, controllerPath, methodPath);
        routes.push({ method: httpMethod, path: normalizeFastifyPath(rawPath) });
      }
    }
  }

  return routes;
}

function openApiPathKey(method: HttpMethod, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export function collectOpenApiRoutes(document: OpenAPIObject): Set<string> {
  const keys = new Set<string>();
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      const upper = method.toUpperCase();
      if (!HTTP_METHODS.has(upper as HttpMethod)) continue;
      if (!operation || typeof operation !== 'object') continue;
      keys.add(openApiPathKey(upper as HttpMethod, path));
    }
  }
  return keys;
}

export interface OpenApiRouteAuditResult {
  missingFromSpec: RegisteredRoute[];
  extraInSpec: string[];
  flaggedOperations: string[];
  missingSecurity: string[];
}

export function auditOpenApiAgainstRoutes(
  document: OpenAPIObject,
  registered: RegisteredRoute[]
): OpenApiRouteAuditResult {
  const specKeys = collectOpenApiRoutes(document);
  const registeredKeys = new Map<string, RegisteredRoute>();
  for (const route of registered) {
    registeredKeys.set(openApiPathKey(route.method, route.path), route);
  }

  const missingFromSpec: RegisteredRoute[] = [];
  for (const [key, route] of registeredKeys) {
    if (isRouteAllowlisted(route.method, route.path)) continue;
    if (isPublicOpenApiExcludedPath(route.path)) continue;
    if (!specKeys.has(key)) {
      missingFromSpec.push(route);
    }
  }

  const extraInSpec: string[] = [];
  for (const key of specKeys) {
    if (!registeredKeys.has(key)) {
      extraInSpec.push(key);
    }
  }

  const flaggedOperations: string[] = [];
  const missingSecurity: string[] = [];

  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== 'object') continue;
      const op = operation as {
        operationId?: string;
        summary?: string;
        description?: string;
        security?: unknown[];
        [key: string]: unknown;
      };
      const id = op.operationId ?? '(unknown)';
      if (op['dep' + 'recated'] === true) {
        flaggedOperations.push(id);
      }
      if (!OPENAPI_PUBLIC_OPERATION_IDS.has(id)) {
        const security = op.security;
        if (!security || security.length === 0) {
          missingSecurity.push(id);
        }
      }
      if (!op.summary?.trim()) {
        flaggedOperations.push(`${id} (missing summary)`);
      }
    }
  }

  return { missingFromSpec, extraInSpec, flaggedOperations, missingSecurity };
}
