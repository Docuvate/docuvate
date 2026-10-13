// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type INestApplication } from '@nestjs/common';
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

function joinRouteSegments(...segments: (string | undefined)[]): string {
  const joined = segments
    .filter((segment): segment is string => Boolean(segment && segment.length > 0))
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return joined ? `/${joined}` : '/';
}

function readPathMetadata(target: object): string {
  const value: unknown = Reflect.getMetadata(PATH_METADATA, target);
  return typeof value === 'string' ? value : '';
}

function readHttpMethodFromHandler(handler: object): HttpMethod | undefined {
  const value: unknown = Reflect.getMetadata(METHOD_METADATA, handler);
  if (typeof value !== 'number') {
    return undefined;
  }
  if (value === 0) {
    return 'GET';
  }
  if (value === 1) {
    return 'POST';
  }
  if (value === 2) {
    return 'PUT';
  }
  if (value === 3) {
    return 'DELETE';
  }
  if (value === 4) {
    return 'PATCH';
  }
  return undefined;
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
      const controllerClass = instance.constructor;
      if (typeof controllerClass !== 'function') {
        continue;
      }
      const controllerPath = readPathMetadata(controllerClass);
      const prototypeRaw: unknown = Object.getPrototypeOf(instance);
      if (typeof prototypeRaw !== 'object' || prototypeRaw === null) {
        continue;
      }
      const prototype: object = prototypeRaw;

      for (const methodName of scanner.getAllMethodNames(prototype)) {
        const handler: unknown = Reflect.get(prototype, methodName);
        if (typeof handler !== 'function') continue;
        if (!isPublicHandler(handler, controllerClass)) continue;

        const httpMethod = readHttpMethodFromHandler(handler);
        if (!httpMethod || !HTTP_METHODS.has(httpMethod)) continue;

        const methodPath = readPathMetadata(handler);
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
  const extraInAllowlist = PUBLIC_ROUTE_ALLOWLIST.filter(
    (r) => !discoveredKeys.has(publicRouteKey(r))
  );

  return { missingFromAllowlist, extraInAllowlist };
}
