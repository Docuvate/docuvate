// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ClientOptions } from 'minio';

export function parseMinioUseSsl(raw: string | undefined): boolean {
  if (raw === undefined || raw.trim() === '') {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export function createMinioClientOptionsFromEnv(
  env: NodeJS.ProcessEnv = process.env
): ClientOptions {
  const endpoint = env['MINIO_ENDPOINT'] ?? 'localhost';
  const port = Number(env['MINIO_PORT'] ?? 9000);
  const region = env['MINIO_REGION']?.trim() || undefined;
  return {
    endPoint: endpoint,
    port,
    useSSL: parseMinioUseSsl(env['MINIO_USE_SSL']),
    accessKey: env['MINIO_ACCESS_KEY'] ?? 'docuvate',
    secretKey: env['MINIO_SECRET_KEY'] ?? 'docuvate-secret',
    ...(region ? { region } : {}),
  };
}
