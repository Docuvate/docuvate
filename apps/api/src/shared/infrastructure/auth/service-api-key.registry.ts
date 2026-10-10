// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { AuthorizationSubject } from '../../domain/authorization.js';
import {
  isRecord,
  parseString,
  parseStringArray,
} from '../database/row-parse.js';
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
    process.env['DOCUVATE_SFTP_INGEST_SERVICE_TENANT_USER_ID']?.trim() ?? 'local-dev-owner';
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

function parseServiceApiKeyEntry(value: unknown): ServiceApiKeyRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  const secret = parseString(value.secret) || parseString(value.key);
  const tenantUserId = parseString(value.tenantUserId) || parseString(value.userId);
  const keyId = parseString(value.keyId) || parseString(value.id) || 'default';
  if (!secret || !tenantUserId) {
    return null;
  }
  const roles = Array.isArray(value.roles) ? parseStringArray(value.roles) : ['integrator'];
  const claims = Array.isArray(value.claims) ? parseStringArray(value.claims) : [];
  return { keyId, secret, tenantUserId, roles, claims };
}

function parseServiceApiKeys(raw: string | undefined): ServiceApiKeyRecord[] {
  if (!raw?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: ServiceApiKeyRecord[] = [];
    for (const entry of parsed) {
      const record = parseServiceApiKeyEntry(entry);
      if (record) {
        out.push(record);
      }
    }
    return out;
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
