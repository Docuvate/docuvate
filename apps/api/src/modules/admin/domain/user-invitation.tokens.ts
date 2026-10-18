// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash, randomBytes } from 'node:crypto';

export function createInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashInvitationToken(token);
  return { token, tokenHash };
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function invitationExpiresAt(now = new Date()): Date {
  const hours = Number(process.env['DOCUVATE_INVITE_TTL_HOURS'] ?? 168);
  const ttlHours = Number.isFinite(hours) && hours > 0 ? hours : 168;
  return new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
}

export function buildInvitationAcceptUrl(token: string): string {
  const webOrigin = process.env['WEB_ORIGIN'] ?? 'http://localhost:5173';
  const base = webOrigin.replace(/\/$/, '');
  return `${base}/invite?token=${encodeURIComponent(token)}`;
}
