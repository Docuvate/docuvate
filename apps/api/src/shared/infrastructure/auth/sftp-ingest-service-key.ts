// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';

const KNOWN_WEAK_KEYS = new Set(['local-sftp-ingest-service-key', 'changeme', 'test']);

export function resolveSftpIngestServiceKey(): string | undefined {
  const filePath = process.env['DOCUVATE_SFTP_INGEST_SERVICE_KEY_FILE']?.trim();
  if (filePath) {
    try {
      const fromFile = readFileSync(filePath, 'utf8').trim();
      if (fromFile) return fromFile;
    } catch {
      /* fall through */
    }
  }
  const raw = process.env['DOCUVATE_SFTP_INGEST_SERVICE_KEY']?.trim();
  return raw || undefined;
}

export function assertSftpIngestServiceKeyAllowed(key: string): void {
  const isProd =
    process.env['NODE_ENV'] === 'production' || process.env['DOCUVATE_ENV'] === 'production';
  if (isProd && KNOWN_WEAK_KEYS.has(key)) {
    throw new Error('Refusing known placeholder DOCUVATE_SFTP_INGEST_SERVICE_KEY in production');
  }
}
