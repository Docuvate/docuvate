import type pg from 'pg';

function explicitSignupFlag(env: NodeJS.ProcessEnv = process.env): 'open' | 'closed' | 'default' {
  const raw = env['DV_ALLOW_SIGNUP']?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') {
    return 'open';
  }
  if (raw === 'false' || raw === '0' || raw === 'no') {
    return 'closed';
  }
  return 'default';
}

export async function hasAnyUser(pool: pg.Pool | pg.PoolClient): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM "user" LIMIT 1) AS exists`
  );
  return result.rows[0]?.exists === true;
}

/** Default: invite-only after the first user exists unless DV_ALLOW_SIGNUP=true. */
export async function isSignupPermitted(pool: pg.Pool | pg.PoolClient): Promise<boolean> {
  const mode = explicitSignupFlag();
  if (mode === 'open') {
    return true;
  }
  if (mode === 'closed') {
    return false;
  }
  return !(await hasAnyUser(pool));
}

export async function assertSignupPermitted(pool: pg.Pool): Promise<void> {
  if (!(await isSignupPermitted(pool))) {
    throw new Error('Self-registration is not allowed');
  }
}
