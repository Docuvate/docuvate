// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { auth as authInstance } from './better-auth.config.js';
import { isBetterAuthAdminPluginPath } from './block-better-auth-admin-routes.js';

type AuthHandler = typeof authInstance;

export function registerBetterAuthHttpRoutes(fastify: FastifyInstance, auth: AuthHandler): void {
  fastify.all(
    '/api/auth/*',
    async (request: FastifyRequest & { rawBody?: Buffer }, reply: FastifyReply) => {
      const host = request.headers.host ?? 'localhost:3001';
      const url = new URL(request.raw.url ?? request.url, `http://${host}`);
      if (isBetterAuthAdminPluginPath(url.pathname)) {
        return reply.status(404).send({
          statusCode: 404,
          message: 'Not Found',
          error: 'Not Found',
        });
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }

      const init: RequestInit = {
        method: request.method,
        headers,
      };
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        if (request.rawBody) {
          init.body = new Uint8Array(request.rawBody);
        } else if (request.body != null) {
          init.body = JSON.stringify(request.body);
        }
      }

      const response = await auth.handler(new Request(url, init));
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'transfer-encoding') return;
        reply.header(key, value);
      });
      const buf = Buffer.from(await response.arrayBuffer());
      return reply.send(buf);
    }
  );
}
