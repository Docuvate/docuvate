// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type INestApplication, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import type {
  OpenAPIObject,
  OperationObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';

import { isOpenApiHttpMethodKey, isOpenApiOperationObject, openApiPathItemOperations } from './openapi-type-guards.js';
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

function readStringMetadata(target: object, metadataKey: string | symbol): string {
  const value: unknown = Reflect.getMetadata(metadataKey, target);
  return typeof value === 'string' ? value : '';
}

const HTTP_BY_REQUEST_METHOD: Record<number, HttpMethod> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.HEAD]: 'HEAD',
  [RequestMethod.OPTIONS]: 'OPTIONS',
};

function readHttpMethodFromHandler(handler: object): HttpMethod | undefined {
  const value: unknown = Reflect.getMetadata(METHOD_METADATA, handler);
  if (typeof value !== 'number') {
    return undefined;
  }
  return HTTP_BY_REQUEST_METHOD[value];
}

function isNestControllerMetatype(
  metatype: unknown
): metatype is abstract new (...args: never[]) => unknown {
  return typeof metatype === 'function';
}

function controllerPrototype(metatype: abstract new (...args: never[]) => unknown): object {
  const prototype: unknown = metatype.prototype;
  if (typeof prototype === 'object' && prototype !== null) {
    return prototype;
  }
  return {};
}

function parseHttpMethod(method: string): HttpMethod | null {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'GET';
    case 'POST':
      return 'POST';
    case 'PUT':
      return 'PUT';
    case 'PATCH':
      return 'PATCH';
    case 'DELETE':
      return 'DELETE';
    case 'HEAD':
      return 'HEAD';
    case 'OPTIONS':
      return 'OPTIONS';
    default:
      return null;
  }
}

function joinRouteSegments(...segments: (string | undefined)[]): string {
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
      const metatype = wrapper.metatype;
      if (metatype == null || !isNestControllerMetatype(metatype)) {
        continue;
      }
      const controllerPath = readStringMetadata(metatype, PATH_METADATA);
      const prototype = controllerPrototype(metatype);

      for (const methodName of scanner.getAllMethodNames(prototype)) {
        const handler: unknown = Reflect.get(prototype, methodName);
        if (typeof handler !== 'function') continue;
        const httpMethod = readHttpMethodFromHandler(handler);
        if (!httpMethod || httpMethod === 'HEAD' || httpMethod === 'OPTIONS') continue;

        const methodPath = readStringMetadata(handler, PATH_METADATA);
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
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!isOpenApiHttpMethodKey(method)) continue;
      const httpMethod = parseHttpMethod(method);
      if (!httpMethod || !HTTP_METHODS.has(httpMethod)) continue;
      if (!isOpenApiOperationObject(operation)) continue;
      keys.add(openApiPathKey(httpMethod, path));
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

function isDeprecatedOperation(operation: OperationObject): boolean {
  return operation.deprecated === true;
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

  for (const pathItem of Object.values(document.paths)) {
    for (const operation of openApiPathItemOperations(pathItem)) {
      const id = operation.operationId ?? '(unknown)';
      if (isDeprecatedOperation(operation)) {
        flaggedOperations.push(id);
      }
      if (!OPENAPI_PUBLIC_OPERATION_IDS.has(id)) {
        const security = operation.security;
        if (!security || security.length === 0) {
          missingSecurity.push(id);
        }
      }
      if (!operation.summary?.trim()) {
        flaggedOperations.push(`${id} (missing summary)`);
      }
    }
  }

  return { missingFromSpec, extraInSpec, flaggedOperations, missingSecurity };
}
