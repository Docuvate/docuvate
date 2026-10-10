// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';

import { stubPgPool } from '../../../shared/infrastructure/database/pg-pool.spec-util.js';
import { hasAnyUser, isSignupPermitted } from './signup-policy.js';

describe('signup policy', () => {
  const originalAllow = process.env.DV_ALLOW_SIGNUP;

  afterEach(() => {
    if (originalAllow === undefined) {
      delete process.env.DV_ALLOW_SIGNUP;
    } else {
      process.env.DV_ALLOW_SIGNUP = originalAllow;
    }
    vi.restoreAllMocks();
  });

  function poolWithUserExists(exists: boolean) {
    return stubPgPool({
      query: vi.fn().mockResolvedValue({ rows: [{ exists }] }),
    });
  }

  it('allows signup when no users exist (default mode)', async () => {
    delete process.env.DV_ALLOW_SIGNUP;
    const pool = poolWithUserExists(false);
    await expect(isSignupPermitted(pool)).resolves.toBe(true);
  });

  it('denies signup after first user when DV_ALLOW_SIGNUP is unset', async () => {
    delete process.env.DV_ALLOW_SIGNUP;
    const pool = poolWithUserExists(true);
    await expect(isSignupPermitted(pool)).resolves.toBe(false);
  });

  it('allows signup when DV_ALLOW_SIGNUP=true even with users', async () => {
    process.env.DV_ALLOW_SIGNUP = 'true';
    const pool = poolWithUserExists(true);
    await expect(isSignupPermitted(pool)).resolves.toBe(true);
  });

  it('denies signup when DV_ALLOW_SIGNUP=false', async () => {
    process.env.DV_ALLOW_SIGNUP = 'false';
    const pool = poolWithUserExists(false);
    await expect(isSignupPermitted(pool)).resolves.toBe(false);
  });

  it('hasAnyUser reads EXISTS from user table', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ exists: true }] });
    const pool = stubPgPool({ query });
    await expect(hasAnyUser(pool)).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM "user"'));
  });
});
