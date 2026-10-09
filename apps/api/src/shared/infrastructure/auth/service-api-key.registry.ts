// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import type { AuthorizationSubject } from '../../domain/authorization.js';
import {
  assertSftpIngestServiceKeyAllowed,
  resolveSftpIngestServiceKey,
} from './sftp-ingest-service-key.js';

export interface ServiceApiKeyRecord {
  keyId: string;
  secret: string;
  tenantUserId: string;
  roles: string[];
  claims: string[];
}

export interface ResolvedServicePrincipal {
  sessionUser: { id: string; email: string; name: string };
  subject: AuthorizationSubject;
}

@Injectable()
export class ServiceApiKeyRegistry {
  private readonly keys: ServiceApiKeyRecord[];

  constructor() {
    this.keys = mergeSftpIngestServiceKey(
      parseServiceApiKeys(process.env['DOCUVATE_SERVICE_API_KEYS'])
    );
  }

  resolve(rawKey: string | undefined): ResolvedServicePrincipal | null {
    if (!rawKey?.trim()) return null;
    const match = this.keys.find((k) => timingSafeEqual(k.secret, rawKey.trim()));
    if (!match) return null;

    return {
      sessionUser: {
        id: match.tenantUserId,
        email: `service+${match.keyId}@docuvate.local`,
        name: `Service ${match.keyId}`,
      },
      subject: {
        kind: 'service',
        id: match.keyId,
        tenantId: match.tenantUserId,
        roles: match.roles,
        claims: match.claims,
      },
    };
  }
}

function mergeSftpIngestServiceKey(keys: ServiceApiKeyRecord[]): ServiceApiKeyRecord[] {
  const sftpKey = resolveSftpIngestServiceKey();
  if (!sftpKey) {
    return keys;
  }
  assertSftpIngestServiceKeyAllowed(sftpKey);
  const tenantUserId =
    process.env['DOCUVATE_SFTP_INGEST_SERVICE_TENANT_USER_ID']?.trim() || 'local-dev-owner';
  if (keys.some((k) => k.keyId === 'sftp-ingest' || timingSafeEqual(k.secret, sftpKey))) {
    return keys;
  }
  return [
    ...keys,
    {
      keyId: 'sftp-ingest',
      secret: sftpKey,
      tenantUserId,
      roles: ['integrator'],
      claims: ['sftp_ingress:service'],
    },
  ];
}

function parseServiceApiKeys(raw: string | undefined): ServiceApiKeyRecord[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry !== 'object' || entry == null) return [];
      const obj = entry as Record<string, unknown>;
      const secret = String(obj['secret'] ?? obj['key'] ?? '');
      const tenantUserId = String(obj['tenantUserId'] ?? obj['userId'] ?? '');
      const keyId = String(obj['keyId'] ?? obj['id'] ?? 'default');
      if (!secret || !tenantUserId) return [];
      const roles = Array.isArray(obj['roles']) ? obj['roles'].map(String) : ['integrator'];
      const claims = Array.isArray(obj['claims']) ? obj['claims'].map(String) : [];
      return [{ keyId, secret, tenantUserId, roles, claims }];
    });
  } catch {
    return [];
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
