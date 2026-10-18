// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

import type { FastifyRequest } from 'fastify';

const TRACEPARENT_RE = /^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/i;

function readHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
  const raw = headers[name];
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) {
    return raw[0].trim();
  }
  return undefined;
}

/** Prefer W3C traceparent trace-id, then inbound x-request-id, else a new UUID. */
export function resolveRequestId(headers: IncomingHttpHeaders): string {
  const traceparent = readHeader(headers, 'traceparent');
  if (traceparent) {
    const match = TRACEPARENT_RE.exec(traceparent);
    if (match?.[1]) {
      return match[1].toLowerCase();
    }
  }
  const inbound = readHeader(headers, 'x-request-id');
  if (inbound) {
    return inbound.slice(0, 64);
  }
  return randomUUID();
}

export function requestIdFromFastify(req: FastifyRequest): string {
  const id = req.id;
  if (typeof id === 'string' && id.trim()) {
    return id.trim();
  }
  if (typeof id === 'number') {
    return String(id);
  }
  return resolveRequestId(req.headers);
}
