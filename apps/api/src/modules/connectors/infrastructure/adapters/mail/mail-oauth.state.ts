// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
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
    process.env['DOCUVATE_CONNECTOR_SECRETS_KEY'] ?? 'dev-insecure-connector-secrets-key-change-me'
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
    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as MailOAuthStatePayload;
    if (Date.now() - parsed.issuedAtMs > 15 * 60 * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function newOAuthNonce(): string {
  return randomBytes(16).toString('hex');
}
