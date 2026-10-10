// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import {
  parseNumber,
  parseOptionalString,
  parseString,
  recordFromUnknown,
} from '../../../../../shared/infrastructure/database/row-parse.js';
import type { ConnectorPluginId } from '../../../domain/connector.types.js';

export interface MailOAuthStatePayload {
  pluginId: Extract<ConnectorPluginId, 'gmail' | 'outlook'>;
  userId: string;
  displayName: string;
  accountHint?: string;
  nonce: string;
  codeVerifier: string;
  issuedAtMs: number;
}

function stateSecret(): string {
  return (
    process.env.DOCUVATE_CONNECTOR_SECRETS_KEY ?? 'dev-insecure-connector-secrets-key-change-me'
  );
}

function sign(payloadB64: string): string {
  return createHmac('sha256', stateSecret()).update(payloadB64).digest('base64url');
}

export function encodeMailOAuthState(payload: MailOAuthStatePayload): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function decodeMailOAuthState(state: string): MailOAuthStatePayload | null {
  const [payloadB64, signature] = state.split('.');
  if (!payloadB64 || !signature) {
    return null;
  }
  const expected = sign(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  try {
    const raw: unknown = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const parsed = parseMailOAuthStatePayload(raw);
    if (!parsed) {
      return null;
    }
    if (Date.now() - parsed.issuedAtMs > 15 * 60 * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseMailOAuthStatePayload(value: unknown): MailOAuthStatePayload | null {
  const row = recordFromUnknown(value);
  if (!row) {
    return null;
  }
  const pluginId = row.pluginId;
  if (pluginId !== 'gmail' && pluginId !== 'outlook') {
    return null;
  }
  const userId = parseString(row.userId);
  const displayName = parseString(row.displayName);
  const nonce = parseString(row.nonce);
  const codeVerifier = parseString(row.codeVerifier);
  const issuedAtMs = parseNumber(row.issuedAtMs, Number.NaN);
  if (!userId || !displayName || !nonce || !codeVerifier || !Number.isFinite(issuedAtMs)) {
    return null;
  }
  const accountHint = parseOptionalString(row.accountHint);
  return {
    pluginId,
    userId,
    displayName,
    accountHint: accountHint ?? undefined,
    nonce,
    codeVerifier,
    issuedAtMs,
  };
}

export function newOAuthNonce(): string {
  return randomBytes(16).toString('hex');
}
