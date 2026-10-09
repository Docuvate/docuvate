// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { createMinioClientOptionsFromEnv, parseMinioUseSsl } from './minio-client.config.js';

describe('parseMinioUseSsl', () => {
  it('defaults to false when unset', () => {
    expect(parseMinioUseSsl(undefined)).toBe(false);
    expect(parseMinioUseSsl('')).toBe(false);
  });

  it('accepts common true values', () => {
    expect(parseMinioUseSsl('true')).toBe(true);
    expect(parseMinioUseSsl('1')).toBe(true);
    expect(parseMinioUseSsl('yes')).toBe(true);
  });
});

describe('createMinioClientOptionsFromEnv', () => {
  it('enables TLS for cloud-style S3 endpoints', () => {
    const opts = createMinioClientOptionsFromEnv({
      MINIO_ENDPOINT: 's3.eu-central-1.amazonaws.com',
      MINIO_PORT: '443',
      MINIO_USE_SSL: 'true',
      MINIO_REGION: 'eu-central-1',
      MINIO_ACCESS_KEY: 'ak',
      MINIO_SECRET_KEY: 'sk',
    });
    expect(opts.useSSL).toBe(true);
    expect(opts.port).toBe(443);
    expect(opts.region).toBe('eu-central-1');
  });
});
