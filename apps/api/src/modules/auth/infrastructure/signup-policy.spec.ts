import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasAnyUser, isSignupPermitted } from './signup-policy.js';

describe('signup policy', () => {
  const originalAllow = process.env['DV_ALLOW_SIGNUP'];

  afterEach(() => {
    if (originalAllow === undefined) {
      delete process.env['DV_ALLOW_SIGNUP'];
    } else {
      process.env['DV_ALLOW_SIGNUP'] = originalAllow;
    }
    vi.restoreAllMocks();
  });

  function poolWithUserExists(exists: boolean) {
    return {
      query: vi.fn().mockResolvedValue({ rows: [{ exists }] }),
    };
  }

  it('allows signup when no users exist (default mode)', async () => {
    delete process.env['DV_ALLOW_SIGNUP'];
    const pool = poolWithUserExists(false);
    await expect(isSignupPermitted(pool as never)).resolves.toBe(true);
  });

  it('denies signup after first user when DV_ALLOW_SIGNUP is unset', async () => {
    delete process.env['DV_ALLOW_SIGNUP'];
    const pool = poolWithUserExists(true);
    await expect(isSignupPermitted(pool as never)).resolves.toBe(false);
  });

  it('allows signup when DV_ALLOW_SIGNUP=true even with users', async () => {
    process.env['DV_ALLOW_SIGNUP'] = 'true';
    const pool = poolWithUserExists(true);
    await expect(isSignupPermitted(pool as never)).resolves.toBe(true);
  });

  it('denies signup when DV_ALLOW_SIGNUP=false', async () => {
    process.env['DV_ALLOW_SIGNUP'] = 'false';
    const pool = poolWithUserExists(false);
    await expect(isSignupPermitted(pool as never)).resolves.toBe(false);
  });

  it('hasAnyUser reads EXISTS from user table', async () => {
    const pool = poolWithUserExists(true);
    await expect(hasAnyUser(pool as never)).resolves.toBe(true);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('FROM "user"'));
  });
});
