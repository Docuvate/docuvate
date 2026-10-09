// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';
import { VerifyPasswordResetTokenUseCase } from './verify-password-reset-token.use-case.js';

describe('VerifyPasswordResetTokenUseCase', () => {
  it('returns valid when a non-expired verification row exists', async () => {
    const query = vi.fn(async (sql: string, params?: unknown[]) => {
      if (params?.[0] === 'reset-password:good-token') {
        return {
          rowCount: 1,
          rows: [{ expiresAt: new Date(Date.now() + 60_000) }],
        };
      }
      return { rowCount: 0, rows: [] };
    });
    const useCase = new VerifyPasswordResetTokenUseCase({ query } as never);
    await expect(useCase.execute('good-token')).resolves.toEqual({ valid: true });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns invalid for unknown tokens after dummy lookup', async () => {
    const query = vi.fn(async () => ({ rowCount: 0, rows: [] }));
    const useCase = new VerifyPasswordResetTokenUseCase({ query } as never);
    await expect(useCase.execute('missing')).resolves.toEqual({ valid: false });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('returns invalid for expired tokens without consuming the row', async () => {
    const query = vi.fn(async () => ({
      rowCount: 1,
      rows: [{ expiresAt: new Date(Date.now() - 60_000) }],
    }));
    const useCase = new VerifyPasswordResetTokenUseCase({ query } as never);
    await expect(useCase.execute('expired')).resolves.toEqual({ valid: false });
    expect(query).toHaveBeenCalledTimes(1);
  });
});
