import { RequestMethod, type INestApplication } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import { IS_PUBLIC_ROUTE_KEY } from './public.decorator.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface PublicRouteEntry {
  method: HttpMethod;
  path: string;
}

/**
 * Explicit allowlist of HTTP routes marked {@link Public}. Any drift fails CI so new
 * public surface requires a deliberate review update.
 */
export const PUBLIC_ROUTE_ALLOWLIST: PublicRouteEntry[] = [
  { method: 'GET', path: '/auth/password-reset/verify' },
  { method: 'GET', path: '/connectors/oauth/callback' },
  { method: 'GET', path: '/health' },
  { method: 'GET', path: '/health/ready' },
  { method: 'GET', path: '/openapi.json' },
];

const HTTP_METHODS = new Set<HttpMethod>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

const NEST_METHOD_TO_HTTP: Partial<Record<RequestMethod, HttpMethod>> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.DELETE]: 'DELETE',
};

function joinRouteSegments(...segments: Array<string | undefined>): string {
  const joined = segments
    .filter((segment): segment is string => Boolean(segment && segment.length > 0))
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return joined ? `/${joined}` : '/';
}

function isPublicHandler(handler: object, controllerClass: object): boolean {
  if (Reflect.getMetadata(IS_PUBLIC_ROUTE_KEY, handler) === true) return true;
  if (Reflect.getMetadata(IS_PUBLIC_ROUTE_KEY, controllerClass) === true) return true;
  return false;
}

export function collectPublicHttpRoutes(
  app: INestApplication,
  options?: { globalPrefix?: string }
): PublicRouteEntry[] {
  const globalPrefix = options?.globalPrefix?.replace(/^\/+|\/+$/g, '') ?? '';
  const modulesContainer = app.get(ModulesContainer);
  const scanner = new MetadataScanner();
  const routes: PublicRouteEntry[] = [];

  for (const module of modulesContainer.values()) {
    for (const wrapper of module.controllers.values()) {
      const { instance } = wrapper;
      if (!instance) continue;
      const controllerClass = instance.constructor as object;
      const controllerPath = Reflect.getMetadata(PATH_METADATA, controllerClass) ?? '';
      const prototype = Object.getPrototypeOf(instance) as object;

      for (const methodName of scanner.getAllMethodNames(prototype)) {
        const handler = prototype[methodName as keyof typeof prototype];
        if (typeof handler !== 'function') continue;
        if (!isPublicHandler(handler, controllerClass)) continue;

        const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
        const httpMethod = requestMethod !== undefined ? NEST_METHOD_TO_HTTP[requestMethod] : undefined;
        if (!httpMethod || !HTTP_METHODS.has(httpMethod)) continue;

        const methodPath = Reflect.getMetadata(PATH_METADATA, handler) ?? '';
        const rawPath = joinRouteSegments(globalPrefix, controllerPath, methodPath);
        routes.push({ method: httpMethod, path: rawPath });
      }
    }
  }

  routes.sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
  return routes;
}

export function publicRouteKey(entry: PublicRouteEntry): string {
  return `${entry.method} ${entry.path}`;
}

export function auditPublicRoutes(discovered: PublicRouteEntry[]): {
  missingFromAllowlist: PublicRouteEntry[];
  extraInAllowlist: PublicRouteEntry[];
} {
  const discoveredKeys = new Set(discovered.map(publicRouteKey));
  const allowlistKeys = new Set(PUBLIC_ROUTE_ALLOWLIST.map(publicRouteKey));

  const missingFromAllowlist = discovered.filter((r) => !allowlistKeys.has(publicRouteKey(r)));
  const extraInAllowlist = PUBLIC_ROUTE_ALLOWLIST.filter((r) => !discoveredKeys.has(publicRouteKey(r)));

  return { missingFromAllowlist, extraInAllowlist };
}
