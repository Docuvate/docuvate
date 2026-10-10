// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  isRecord,
  parseNumber,
  parseString,
} from '../../../../../shared/infrastructure/database/row-parse.js';

export function parseSftpProbeResponse(value: unknown): { hostKeyFingerprintSha256: string } {
  const row = isRecord(value) ? value : null;
  if (!row) {
    throw new Error('SFTP_PROBE_FAILED');
  }
  const fingerprint = parseString(row.hostKeyFingerprintSha256);
  if (!fingerprint) {
    throw new Error('SFTP_PROBE_FAILED');
  }
  return { hostKeyFingerprintSha256: fingerprint };
}

function parseSftpListFileRow(value: unknown): { path: string; name: string; sizeBytes: number } | null {
  const row = isRecord(value) ? value : null;
  if (!row) {
    return null;
  }
  const path = parseString(row.Path) || parseString(row.path);
  const name = parseString(row.Name) || parseString(row.name);
  const sizeBytes = parseNumber(row.SizeBytes ?? row.sizeBytes, -1);
  if (!path || !name || sizeBytes < 0) {
    return null;
  }
  return { path, name, sizeBytes };
}

export function parseSftpListResponse(
  value: unknown
): { path: string; name: string; sizeBytes: number }[] {
  const row = isRecord(value) ? value : null;
  if (!row || !Array.isArray(row.files)) {
    throw new Error('SFTP_LIST_FAILED');
  }
  const files: { path: string; name: string; sizeBytes: number }[] = [];
  for (const entry of row.files) {
    const parsed = parseSftpListFileRow(entry);
    if (parsed) {
      files.push(parsed);
    }
  }
  return files;
}
