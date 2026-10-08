#!/usr/bin/env node
/** Demo tree for ordnerbaum PR tests (EHW+, long names). Landing marketing: seed-folders-marketing.mjs */
const API = process.env.API_BASE ?? 'http://localhost:3001/v1';
const AUTH = process.env.AUTH_BASE ?? 'http://localhost:3001/api/auth';

async function ensureSession() {
  if (process.env.COOKIE) return process.env.COOKIE;
  const signInOnly = async () => {
    const signIn = await fetch(`${AUTH}/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ email: 'demo@screens.local', password: 'screenshot-demo-12' }),
    });
    const cookies = signIn.headers.getSetCookie?.() ?? [];
    if (signIn.ok && cookies.length > 0) {
      return cookies.map((c) => c.split(';')[0]).join('; ');
    }
    return null;
  };
  const existing = await signInOnly();
  if (existing) return existing;
  const signUp = await fetch(`${AUTH}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({
      email: 'demo@screens.local',
      password: 'screenshot-demo-12',
      name: 'Screenshot Demo',
    }),
  });
  if (signUp.ok || signUp.status === 422) {
    const retry = await signInOnly();
    if (retry) return retry;
    throw new Error('Auth failed: sign-in after sign-up');
  }
  throw new Error(`Auth failed: sign-up ${signUp.status}`);
}

async function authed(cookie, path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Cookie: cookie,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function deleteFolderById(cookie, folderId) {
  const res = await fetch(`${API}/folders/${folderId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  if (res.status === 404) return;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`/folders/${folderId} ${res.status}: ${JSON.stringify(body)}`);
  }
}

async function deleteAllFoldersInMappe(cookie, mappeId) {
  for (let pass = 0; pass < 30; pass += 1) {
    const folders = await authed(cookie, '/folders');
    const inMappe = (folders.items ?? []).filter((f) => f.mappeId === mappeId);
    if (inMappe.length === 0) break;
    const leaves = inMappe.filter((f) => !inMappe.some((other) => other.parentId === f.id));
    for (const folder of leaves) {
      await deleteFolderById(cookie, folder.id);
    }
  }
}

async function findOrCreateFolder(cookie, { name, mappeId, parentId }) {
  const folders = await authed(cookie, '/folders');
  const pid = parentId ?? null;
  const found = (folders.items ?? []).find(
    (f) => f.name === name && f.mappeId === mappeId && (f.parentId ?? null) === pid
  );
  if (found) return found;
  return authed(cookie, '/folders', {
    method: 'POST',
    body: JSON.stringify({ name, mappeId, parentId: pid }),
  });
}

async function main() {
  const cookie = await ensureSession();
  const mappen = await authed(cookie, '/mappen');
  let ehw = mappen.items?.find((m) => m.name === 'EHW+');
  if (!ehw) {
    ehw = await authed(cookie, '/mappen', { method: 'POST', body: JSON.stringify({ name: 'EHW+' }) });
  }

  await deleteAllFoldersInMappe(cookie, ehw.id);

  const direkt = await findOrCreateFolder(cookie, { name: 'Direkt', mappeId: ehw.id, parentId: null });
  await findOrCreateFolder(cookie, { name: 'Rechnungen', mappeId: ehw.id, parentId: null });
  await findOrCreateFolder(cookie, {
    name: 'Sehr langer Ordnername für Tooltip-Demo',
    mappeId: ehw.id,
    parentId: null,
  });
  await findOrCreateFolder(cookie, { name: 'Archiv', mappeId: ehw.id, parentId: null });
  const vertraege = await findOrCreateFolder(cookie, { name: 'Verträge', mappeId: ehw.id, parentId: null });
  await findOrCreateFolder(cookie, { name: 'Unterlagen', mappeId: ehw.id, parentId: vertraege.id });

  const sessionToken = cookie
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith('better-auth.session_token='));
  const authCookie = sessionToken ? sessionToken.split('=').slice(1).join('=') : cookie;

  console.log(
    JSON.stringify(
      { ehwMappeId: ehw.id, direktFolderId: direkt.id, authCookie },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
