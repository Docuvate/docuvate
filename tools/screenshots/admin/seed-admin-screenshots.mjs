#!/usr/bin/env node
/**
 * Seeds neutral demo users for admin UI screenshots (local / compose only).
 * Requires SEED_PURGE_NON_DEMO=1 before deleting non-@beispiel.de accounts.
 */
import { execFileSync } from 'node:child_process';

const AUTH = process.env.AUTH_BASE ?? 'http://localhost:3001/api/auth';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const API = process.env.API_BASE ?? 'http://localhost:3001/v1';
const COMPOSE_ARGS = process.env.COMPOSE_FILE
  ? process.env.COMPOSE_FILE.split(':').flatMap((f) => ['-f', f])
  : ['-f', 'docker-compose.yml', '-f', 'tools/screenshots/admin/docker-compose.seed-override.yml'];

const ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? 'elena.kraemer@beispiel.de',
  password: process.env.SEED_ADMIN_PASSWORD ?? 'AdminDemo12!',
  name: 'Elena Krämer',
};
const SECOND_ADMIN = {
  email: 'sven.hartmann@beispiel.de',
  password: 'SecondAdmin12!',
  name: 'Sven Hartmann',
};
const MEMBER = {
  email: 'julia.koehler@beispiel.de',
  password: 'MemberDemo12!',
  name: 'Julia Köhler',
};
const BLOCKED = {
  email: 'jonas.weber@beispiel.de',
  password: 'BlockedDemo12!',
  name: 'Jonas Weber',
};
const INVITED = {
  email: 'anna.schulz@beispiel.de',
  name: 'Anna Schulz',
};

const BEISPIEL_ALLOWLIST = [
  ADMIN.email,
  MEMBER.email,
  BLOCKED.email,
  INVITED.email,
  'sven.hartmann@beispiel.de',
].map((e) => e.toLowerCase());

function psql(sql) {
  execFileSync(
    'docker',
    ['compose', ...COMPOSE_ARGS, 'exec', '-T', 'postgres', 'psql', '-U', 'docuvate', '-d', 'docuvate', '-c', sql],
    { stdio: 'inherit', cwd: process.cwd() }
  );
}

function promoteToAdmin(email) {
  const safe = email.replace(/'/g, "''");
  psql(`
    INSERT INTO installation_user_roles (user_id, role)
    SELECT id, 'installation_admin'
    FROM "user"
    WHERE lower(email) = lower('${safe}')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  `);
}

function purgeNonDemoUsers() {
  if (process.env.SEED_PURGE_NON_DEMO !== '1') {
    throw new Error('Refusing to purge users: set SEED_PURGE_NON_DEMO=1 to confirm');
  }
  const inList = BEISPIEL_ALLOWLIST.map((e) => `'${e.replace(/'/g, "''")}'`).join(', ');
  psql(`
    DELETE FROM user_invitations;
    DELETE FROM session WHERE "userId" IN (
      SELECT id FROM "user" WHERE lower(email) NOT IN (${inList})
    );
    DELETE FROM account WHERE "userId" IN (
      SELECT id FROM "user" WHERE lower(email) NOT IN (${inList})
    );
    DELETE FROM "user" WHERE lower(email) NOT IN (${inList});
  `);
}

async function signUp(body) {
  const res = await fetch(`${AUTH}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
    body: JSON.stringify(body),
  });
  if (res.status === 422 || res.status === 409 || res.status === 429) return;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`sign-up failed for ${body.email}: ${res.status} ${text}`);
  }
}

async function signIn(email, password) {
  const res = await fetch(`${AUTH}/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`sign-in failed for ${email}: ${res.status}`);
  }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const singleSetCookie = res.headers.get('set-cookie');
  if (setCookie.length > 0) {
    return setCookie.map((c) => c.split(';')[0]).join('; ');
  }
  return singleSetCookie ?? '';
}

async function apiFetch(path, cookie, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Origin: WEB_ORIGIN,
      Cookie: cookie,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function ensureBlockedUser(adminCookie) {
  let users = await apiFetch('/admin/users', adminCookie);
  if (!users.users?.some((u) => u.email === BLOCKED.email)) {
    const res = await fetch(`${AUTH}/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
      body: JSON.stringify(BLOCKED),
    });
    if (!res.ok && res.status !== 409 && res.status !== 429) {
      const text = await res.text();
      throw new Error(`blocked demo sign-up failed: ${res.status} ${text}`);
    }
    users = await apiFetch('/admin/users', adminCookie);
  }
  if (!users.users?.some((u) => u.email === BLOCKED.email)) {
    throw new Error(`blocked demo user ${BLOCKED.email} missing after seed`);
  }
  const blocked = users.users?.find((u) => u.email === BLOCKED.email);
  if (blocked && !blocked.banned) {
    await apiFetch(`/admin/users/${blocked.id}/ban`, adminCookie, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Screenshot demo suspension' }),
    });
  }
}

async function main() {
  purgeNonDemoUsers();

  await signUp(ADMIN);
  await signUp(SECOND_ADMIN);
  await signUp(MEMBER);
  await signUp(BLOCKED);

  const adminCookie = await signIn(ADMIN.email, ADMIN.password);

  let usersBefore;
  try {
    usersBefore = await apiFetch('/admin/users', adminCookie);
  } catch (err) {
    if (!String(err).includes('403')) {
      throw err;
    }
    promoteToAdmin(ADMIN.email);
    usersBefore = await apiFetch('/admin/users', adminCookie);
  }

  let demoteTarget = usersBefore.users?.find((u) => u.email === SECOND_ADMIN.email);
  if (!demoteTarget) {
    demoteTarget = usersBefore.users?.find((u) => u.email === MEMBER.email);
  }
  if (demoteTarget && demoteTarget.role !== 'admin') {
    await apiFetch(`/admin/users/${demoteTarget.id}/role`, adminCookie, {
      method: 'PATCH',
      body: JSON.stringify({ role: 'admin' }),
    });
  }

  try {
    await apiFetch('/admin/users', adminCookie, {
      method: 'POST',
      body: JSON.stringify({ email: INVITED.email, name: INVITED.name, role: 'member' }),
    });
  } catch (err) {
    if (!String(err).includes('invitationAlreadyPending')) {
      throw err;
    }
  }

  await ensureBlockedUser(adminCookie);

  const users = await apiFetch('/admin/users', adminCookie);
  const memberRow = users.users?.find((u) => u.email === MEMBER.email);
  if (memberRow?.id) {
    const memberId = memberRow.id.replace(/'/g, "''");
    psql(`
      DELETE FROM "twoFactor" WHERE "userId" = '${memberId}';
      UPDATE "user" SET "twoFactorEnabled" = false WHERE id = '${memberId}';
      DELETE FROM passkey WHERE "userId" = '${memberId}';
      INSERT INTO passkey (
        id, name, "publicKey", "userId", "credentialID", counter, "deviceType", "backedUp"
      ) VALUES (
        'screenshot-passkey-1',
        'MacBook Touch ID',
        'screenshot-demo-public-key',
        '${memberId}',
        'screenshot-demo-credential-id',
        0,
        'platform',
        true
      );
    `);
  }

  process.stderr.write('seed-admin-screenshots: demo users ready (@beispiel.de only)\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
