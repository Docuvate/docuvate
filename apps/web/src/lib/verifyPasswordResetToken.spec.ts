// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';

import { verifyPasswordResetToken } from './verifyPasswordResetToken';

describe('verifyPasswordResetToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns valid when API responds with valid true', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => ({
        ok: true,
        json: () => ({ valid: true }),
      }))
    );
    await expect(verifyPasswordResetToken('abc')).resolves.toEqual({ valid: true });
  });

  it('returns invalid on HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => ({
        ok: false,
        json: () => ({ valid: true }),
      }))
    );
    await expect(verifyPasswordResetToken('abc')).resolves.toEqual({ valid: false });
  });
});
