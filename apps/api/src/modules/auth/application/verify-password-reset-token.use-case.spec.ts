// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { stubPgPool } from '../../../shared/infrastructure/database/pg-pool.spec-util.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { VerifyPasswordResetTokenUseCase } from './verify-password-reset-token.use-case.js';

async function buildUseCase(query: ReturnType<typeof vi.fn>) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      VerifyPasswordResetTokenUseCase,
      { provide: PG_POOL, useValue: stubPgPool({ query }) },
    ],
  }).compile();
  return moduleRef.get(VerifyPasswordResetTokenUseCase);
}

describe('VerifyPasswordResetTokenUseCase', () => {
  it('returns valid when a non-expired verification row exists', async () => {
    const query = vi.fn((_sql: string, params?: unknown[]) => {
      if (params?.[0] === 'reset-password:good-token') {
        return Promise.resolve({
          rowCount: 1,
          rows: [{ expiresAt: new Date(Date.now() + 60_000) }],
        });
      }
      return Promise.resolve({ rowCount: 0, rows: [] });
    });
    const useCase = await buildUseCase(query);
    await expect(useCase.execute('good-token')).resolves.toEqual({ valid: true });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns invalid for unknown tokens after dummy lookup', async () => {
    const query = vi.fn(() => Promise.resolve({ rowCount: 0, rows: [] }));
    const useCase = await buildUseCase(query);
    await expect(useCase.execute('missing')).resolves.toEqual({ valid: false });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('returns invalid for expired tokens without consuming the row', async () => {
    const query = vi.fn(() =>
      Promise.resolve({
        rowCount: 1,
        rows: [{ expiresAt: new Date(Date.now() - 60_000) }],
      })
    );
    const useCase = await buildUseCase(query);
    await expect(useCase.execute('expired')).resolves.toEqual({ valid: false });
    expect(query).toHaveBeenCalledTimes(1);
  });
});
