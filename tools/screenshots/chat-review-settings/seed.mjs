#!/usr/bin/env node
/**
 * Synthetic fixture data for PR-J screenshots (chat, review admin users).
 */
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(path.join(REPO_ROOT, 'apps/api/package.json'));

const AUTH = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001/api/auth';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://127.0.0.1:5173';
const API = process.env.API_BASE ?? 'http://127.0.0.1:3001/v1';
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';

const SCREENSHOT_USER = {
  email: process.env.SCREENSHOT_USER_EMAIL ?? 'ordner.demo@fixture.docuvate.test',
  password: process.env.SCREENSHOT_USER_PASSWORD ?? 'screenshot-demo-12',
  name: process.env.SCREENSHOT_USER_NAME ?? 'Ordner Demo',
};

const E10_FIXTURE = {
  invited: {
    email: 'mustermensch@docuvate.de',
    name: 'Hades Mustermensch',
  },
  member: {
    email: 'jonas.klein@fixture.docuvate.test',
    password: 'FixtureMember12!',
    name: 'Jonas Klein',
  },
  blocked: {
    email: 'praktikant@fixture.docuvate.test',
    password: 'FixtureBlocked12!',
    name: 'Praktikant',
  },
};

function hashInvitationToken(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

async function inviteAndAccept(adminCookie, adminUserId, { email, name, password }) {
  const existing = await apiFetch('/admin/users', adminCookie);
  if (existing.users?.some((u) => u.email === email && u.accountStatus !== 'invited')) {
    return;
  }
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashInvitationToken(token);
  const safeEmail = email.replace(/'/g, "''");
  const safeName = name.replace(/'/g, "''");
  await psql(`
    DELETE FROM user_invitations
    WHERE lower(invitee_email) = lower('${safeEmail}');
  `);
  await psql(`
    INSERT INTO user_invitations (
      invitee_email, invitee_name, assigned_role, invited_by_user_id, token_hash, expires_at
    ) VALUES (
      '${safeEmail}', '${safeName}', 'installation_member', '${adminUserId.replace(/'/g, "''")}',
      '${tokenHash}', now() + interval '7 days'
    );
  `);
  const res = await fetch(`${API.replace(/\/v1$/, '')}/v1/invitations/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    throw new Error(`accept invitation failed ${email}: ${res.status} ${await res.text()}`);
  }
}

async function ensureFixtureUser(body) {
  const res = await fetch(`${AUTH}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
    body: JSON.stringify(body),
  });
  if (res.ok || res.status === 422 || res.status === 409 || res.status === 429) return;
  if (res.status === 403 || res.status === 400 || res.status === 500) {
    const login = await signIn(body.email, body.password);
    if (login) return;
  }
  throw new Error(`sign-up failed ${body.email}: ${res.status} ${await res.text()}`);
}

async function signIn(email, password) {
  const res = await fetch(`${AUTH}/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`sign-in failed ${email}: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const single = res.headers.get('set-cookie');
  if (setCookie.length > 0) return setCookie.map((c) => c.split(';')[0]).join('; ');
  return single?.split(';')[0] ?? '';
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
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function psql(sql) {
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  return pool
    .query(sql)
    .finally(() => pool.end());
}

async function promoteAdmin(email) {
  const safe = email.replace(/'/g, "''");
  await psql(`
    INSERT INTO installation_user_roles (user_id, role)
    SELECT id, 'installation_admin'
    FROM "user"
    WHERE lower(email) = lower('${safe}')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  `);
}

async function seedChatThreads(userId) {
  await psql(`
    DELETE FROM chat_messages WHERE thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = '${userId.replace(/'/g, "''")}'
    );
    DELETE FROM chat_threads WHERE user_id = '${userId.replace(/'/g, "''")}';
  `);

  const titles = [
    'Was kostet die Hundesteuer?',
    'Stromkosten 2026',
    'Kündigungsfrist Mietvertrag',
    'Versicherungsbeiträge',
  ];
  for (const title of titles) {
    await psql(`
      WITH t AS (
        INSERT INTO chat_threads (user_id, title, scope)
        VALUES ('${userId.replace(/'/g, "''")}', '${title.replace(/'/g, "''")}', 'library')
        RETURNING id
      )
      INSERT INTO chat_messages (thread_id, role, content, generation_status)
      SELECT id, 'user', 'Was kostet die Hundesteuer?', 'complete' FROM t
      UNION ALL
      SELECT id, 'assistant', 'Die Hundesteuer beträgt 108,00 € pro Jahr für einen Hund, fällig jeweils am 15.02.', 'complete' FROM t;
    `);
  }
}

async function touchSession(userId, offsetMinutes) {
  await psql(`
    INSERT INTO session (id, "expiresAt", token, "createdAt", "updatedAt", "userId")
    VALUES (
      'fixture-sess-${userId.slice(0, 8)}-${offsetMinutes}',
      now() + interval '7 days',
      'fixture-token-${userId.slice(0, 8)}-${offsetMinutes}',
      now() - interval '${offsetMinutes} minutes',
      now() - interval '${offsetMinutes} minutes',
      '${userId.replace(/'/g, "''")}'
    )
    ON CONFLICT (id) DO UPDATE SET "updatedAt" = now() - interval '${offsetMinutes} minutes';
  `);
}

async function seedE10(adminCookie, adminUserId) {
  await inviteAndAccept(adminCookie, adminUserId, E10_FIXTURE.member);
  await inviteAndAccept(adminCookie, adminUserId, E10_FIXTURE.blocked);

  let users = await apiFetch('/admin/users', adminCookie);
  const blocked = users.users?.find((u) => u.email === E10_FIXTURE.blocked.email);
  if (blocked && !blocked.banned) {
    await apiFetch(`/admin/users/${blocked.id}/ban`, adminCookie, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Fixture suspension' }),
    });
  }

  const hasInvite = users.users?.some((u) => u.email === E10_FIXTURE.invited.email);
  if (!hasInvite) {
    try {
      await apiFetch('/admin/users', adminCookie, {
        method: 'POST',
        body: JSON.stringify({
          email: E10_FIXTURE.invited.email,
          name: E10_FIXTURE.invited.name,
          role: 'member',
        }),
      });
    } catch (err) {
      if (!String(err).includes('invitationAlreadyPending')) throw err;
    }
  }

  users = await apiFetch('/admin/users', adminCookie);
  const self = users.users?.find((u) => u.email === SCREENSHOT_USER.email);
  const member = users.users?.find((u) => u.email === E10_FIXTURE.member.email);
  const blockedRow = users.users?.find((u) => u.email === E10_FIXTURE.blocked.email);
  if (self?.id) await touchSession(self.id, 1);
  if (member?.id) await touchSession(member.id, 60 * 26);
  if (blockedRow?.id) await touchSession(blockedRow.id, 60 * 24 * 60);
}

async function enableAdvancedSettings(cookie) {
  try {
    await apiFetch('/settings', cookie, {
      method: 'PATCH',
      body: JSON.stringify({ advancedFeaturesEnabled: true }),
    });
  } catch (err) {
    if (!String(err).includes('403')) throw err;
  }
  try {
    await apiFetch('/settings', cookie, {
      method: 'PATCH',
      body: JSON.stringify({ preferredChatProvider: null }),
    });
  } catch {
    /* chat provider may be server-gated */
  }
}

async function main() {
  let cookie = await signIn(SCREENSHOT_USER.email, SCREENSHOT_USER.password);
  if (!cookie) {
    await ensureFixtureUser(SCREENSHOT_USER);
    cookie = await signIn(SCREENSHOT_USER.email, SCREENSHOT_USER.password);
  }
  if (!cookie) throw new Error(`cannot sign in seed user ${SCREENSHOT_USER.email}`);
  await promoteAdmin(SCREENSHOT_USER.email);

  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const userRow = await pool.query(`SELECT id FROM "user" WHERE email = $1 LIMIT 1`, [
    SCREENSHOT_USER.email,
  ]);
  const userId = userRow.rows[0]?.id;
  await pool.end();
  if (!userId) throw new Error('screenshot user missing');

  await seedChatThreads(userId);
  await seedE10(cookie, userId);
  await enableAdvancedSettings(cookie);
  await psql(`
    INSERT INTO user_preferences (user_id, advanced_features_enabled, preferred_chat_provider)
    VALUES ('${userId.replace(/'/g, "''")}', true, NULL)
    ON CONFLICT (user_id) DO UPDATE SET
      advanced_features_enabled = true,
      preferred_chat_provider = NULL;
  `);

  console.log(JSON.stringify({ ok: true, userId, email: SCREENSHOT_USER.email }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
