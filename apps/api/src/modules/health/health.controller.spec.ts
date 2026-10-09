// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller.js';

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
    disconnect: vi.fn(),
  })),
}));

vi.mock('minio', () => ({
  Client: vi.fn().mockImplementation(() => ({
    bucketExists: vi.fn().mockResolvedValue(true),
  })),
}));

describe('HealthController ready', () => {
  beforeEach(() => {
    vi.stubEnv('VALKEY_URL', 'redis://127.0.0.1:6379');
    vi.stubEnv('MINIO_ENDPOINT', '127.0.0.1');
    vi.stubEnv('MINIO_ACCESS_KEY', 'key');
    vi.stubEnv('MINIO_SECRET_KEY', 'secret');
  });

  it('returns degraded when postgres check fails', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('down')),
    } as unknown as import('pg').Pool;
    const controller = new HealthController(pool);
    await expect(controller.ready()).resolves.toMatchObject({
      status: 'degraded',
      checks: { postgres: 'fail' },
    });
  });

  it('returns ready when dependencies succeed', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as unknown as import('pg').Pool;
    const controller = new HealthController(pool);
    await expect(controller.ready()).resolves.toMatchObject({ status: 'ready' });
  });
});
