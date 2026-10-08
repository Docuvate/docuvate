#!/usr/bin/env node
/**
 * Seeds demo mappen/folders for filesystem screenshots. Requires logged-in session cookie in COOKIE env
 * or registers demo@screens.local / screenshot-demo-12 via better-auth.
 */
const API = process.env.API_BASE ?? 'http://localhost:3001/v1';
const AUTH = process.env.AUTH_BASE ?? 'http://localhost:3001/api/auth';

async function jsonFetch(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...(init.headers ?? {}), 'Content-Type': 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${url} ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function ensureSession() {
  if (process.env.COOKIE) return process.env.COOKIE;
  const signInOnly = async () => {
    const signIn = await fetch(`${AUTH}/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({
        email: 'demo@screens.local',
        password: 'screenshot-demo-12',
      }),
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
  const setCookie = signUp.headers.getSetCookie?.() ?? [];
  if (signUp.ok || signUp.status === 422) {
    const signIn = await fetch(`${AUTH}/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({
        email: 'demo@screens.local',
        password: 'screenshot-demo-12',
      }),
    });
    const cookies = [...setCookie, ...(signIn.headers.getSetCookie?.() ?? [])];
    return cookies.map((c) => c.split(';')[0]).join('; ');
  }
  throw new Error(`Auth failed: ${signUp.status}`);
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
  if (res.status === 401) {
    const err = new Error(`${path} ${res.status}: ${JSON.stringify(body)}`);
    err.code = 'UNAUTHENTICATED';
    throw err;
  }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function deleteMappeDocuments(cookie, mappeId) {
  for (let pass = 0; pass < 20; pass += 1) {
    const list = await authed(cookie, `/documents?mappeId=${mappeId}`);
    const items = list.items ?? [];
    if (items.length === 0) break;
    for (const doc of items) {
      await authed(cookie, `/documents/${doc.id}`, { method: 'DELETE' });
    }
  }
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
    const leaves = inMappe.filter(
      (f) => !inMappe.some((other) => other.parentId === f.id)
    );
    for (const folder of leaves) {
      await deleteFolderById(cookie, folder.id);
    }
  }
}

async function deleteMappeFully(cookie, mappeId) {
  await deleteMappeDocuments(cookie, mappeId);
  await deleteAllFoldersInMappe(cookie, mappeId);
  await authed(cookie, `/mappen/${mappeId}`, { method: 'DELETE' });
}

async function findOrCreateFolder(cookie, { name, mappeId, parentId }) {
  const folders = await authed(cookie, '/folders');
  const existing = folders.items ?? [];
  const pid = parentId ?? null;
  const found = existing.find(
    (f) => f.name === name && f.mappeId === mappeId && (f.parentId ?? null) === pid
  );
  if (found) return found;
  return authed(cookie, '/folders', {
    method: 'POST',
    body: JSON.stringify({ name, mappeId, parentId: pid }),
  });
}

async function main() {
  let cookie = await ensureSession();
  let mappen;
  try {
    mappen = await authed(cookie, '/mappen');
  } catch (err) {
    if (err?.code === 'UNAUTHENTICATED' && process.env.COOKIE) {
      delete process.env.COOKIE;
      cookie = await ensureSession();
      mappen = await authed(cookie, '/mappen');
    } else {
      throw err;
    }
  }
  let ehw = mappen.items?.find((m) => m.name === 'EHW+');
  if (!ehw) {
    ehw = await authed(cookie, '/mappen', { method: 'POST', body: JSON.stringify({ name: 'EHW+' }) });
  }

  const legacyHausMappe = mappen.items?.find((m) => m.name === 'Haus');
  if (legacyHausMappe) {
    await deleteMappeFully(cookie, legacyHausMappe.id);
  }

  await deleteMappeDocuments(cookie, ehw.id);
  await deleteAllFoldersInMappe(cookie, ehw.id);

  const hausFolder = await findOrCreateFolder(cookie, {
    name: 'Haus',
    mappeId: ehw.id,
    parentId: null,
  });
  for (const name of ['Internet', 'Möbel', 'PV']) {
    await findOrCreateFolder(cookie, {
      name,
      mappeId: ehw.id,
      parentId: hausFolder.id,
    });
  }

  const fixtures = [
    {
      path: '/workspace/experiments/fixtures/stromrechnung-juli.pdf',
      uploadName: 'stromrechnung-juli.pdf',
      title: 'Stromrechnung Juli',
    },
    {
      path: '/workspace/experiments/fixtures/mietvertrag-werkstatt.pdf',
      uploadName: 'mietvertrag-werkstatt.pdf',
      title: 'Mietvertrag Werkstatt',
    },
  ];
  for (const fixture of fixtures) {
    const file = await import('node:fs/promises').then((fs) => fs.readFile(fixture.path));
    const name = fixture.uploadName;
    const form = new FormData();
    form.append('file', new Blob([file]), name);
    const res = await fetch(`${API}/documents?mappeId=${ehw.id}`, {
      method: 'POST',
      headers: { Cookie: cookie },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`upload ${name} ${res.status}: ${body}`);
    }
    const created = await res.json();
    if (fixture.title && created?.id) {
      await authed(cookie, `/documents/${created.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: fixture.title }),
      });
    }
  }

  await new Promise((r) => setTimeout(r, 2000));
  for (let pass = 0; pass < 40; pass += 1) {
    const list = await authed(cookie, `/documents?mappeId=${ehw.id}`);
    const items = list.items ?? [];
    let changed = false;
    for (const doc of items) {
      const stack = doc.duplicateStack;
      if (stack?.pendingReview || (stack?.versionCount ?? 0) > 0) {
        await authed(cookie, `/documents/${doc.id}/duplicate-stack/not-duplicate`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        changed = true;
      }
    }
    if (!changed && pass >= 3) break;
    await new Promise((r) => setTimeout(r, 750));
  }

  for (let pass = 0; pass < 90; pass += 1) {
    const list = await authed(cookie, `/documents?mappeId=${ehw.id}`);
    const items = list.items ?? [];
    const allReady = items.length >= 2 && items.every((doc) => {
      const status = doc.status ?? doc.processingStatus;
      const ready = status === 'ready';
      const noDup = !doc.duplicateStack?.pendingReview;
      return ready && noDup;
    });
    if (allReady) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  const sessionToken = cookie
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith('better-auth.session_token='));
  const authCookie = sessionToken ? sessionToken.split('=').slice(1).join('=') : cookie;

  console.log(JSON.stringify({ ehwMappeId: ehw.id, hausFolderId: hausFolder.id, authCookie }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
