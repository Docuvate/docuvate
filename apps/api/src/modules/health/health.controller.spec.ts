// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { stubPgPool } from '../../shared/infrastructure/database/pg-pool.spec-util.js';
import { PG_POOL } from '../../shared/infrastructure/database/tokens.js';
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

  async function buildController(query: ReturnType<typeof vi.fn>) {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PG_POOL, useValue: stubPgPool({ query }) }],
    }).compile();
    return moduleRef.get(HealthController);
  }

  it('returns degraded when postgres check fails', async () => {
    const controller = await buildController(vi.fn().mockRejectedValue(new Error('down')));
    await expect(controller.ready()).resolves.toMatchObject({
      status: 'degraded',
      checks: { postgres: 'fail' },
    });
  });

  it('returns ready when dependencies succeed', async () => {
    const controller = await buildController(vi.fn().mockResolvedValue({ rows: [] }));
    await expect(controller.ready()).resolves.toMatchObject({ status: 'ready' });
  });
});
