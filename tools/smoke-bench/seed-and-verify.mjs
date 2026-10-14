#!/usr/bin/env node
/**
 * Smoke profile seeder: upload synthetic fixtures, wait for pipeline, run cited-chat checks.
 * CPU-only stack (no Ollama); uses extractive cited-chat fallback.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));

const AUTH_BASE = process.env.AUTH_BASE ?? 'http://api:3001';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const EMAIL = process.env.SMOKE_USER_EMAIL ?? 'smoke.bench@fixture.docuvate.test';
const PASSWORD = process.env.SMOKE_USER_PASSWORD ?? 'SmokeBenchFixture1!';
const NAME = process.env.SMOKE_USER_NAME ?? 'Smoke Bench';
const WAIT_MS = Number(process.env.SMOKE_PIPELINE_TIMEOUT_MS ?? 240_000);

const ABSTENTION_SNIPPET = 'nichts gefunden';

async function signIn() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const signUp = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: NAME }),
    });
    if (!signUp.ok && signUp.status !== 422) {
      throw new Error(`sign-up failed ${signUp.status}: ${await signUp.text()}`);
    }
    const retry = await fetch(`${AUTH_BASE}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!retry.ok) {
      throw new Error(`sign-in failed ${retry.status}: ${await retry.text()}`);
    }
    return retry.headers.get('set-cookie') ?? '';
  }
  return res.headers.get('set-cookie') ?? '';
}

async function api(cookie, method, path, body) {
  const headers = { origin: WEB_ORIGIN };
  if (cookie) {
    headers.cookie = cookie.split(';')[0];
  }
  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body != null) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${AUTH_BASE}${path}`, { method, headers, body: payload });
  if (!res.ok) {
    throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function waitDocumentPipeline(cookie, id) {
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    const doc = await api(cookie, 'GET', `/v1/documents/${id}`);
    if (doc.status === 'failed') {
      throw new Error(`document ${id} failed: ${JSON.stringify(doc)}`);
    }
    const text = String(doc.extraction?.text ?? doc.extractedText ?? '').trim();
    const hasText = text.length >= 8;
    const labelsReady = Array.isArray(doc.tagIds) ? doc.tagIds.length >= 0 : true;
    if (doc.status === 'ready' && hasText && labelsReady) {
      return doc;
    }
    await sleep(2000);
  }
  throw new Error(`timeout waiting for document ${id} (pipeline ${WAIT_MS}ms)`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function uploadFixture(cookie, fixture) {
  const bytes = readFileSync(join(here, 'fixtures', fixture.file));
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: fixture.mime }), fixture.file);
  const created = await api(cookie, 'POST', '/v1/documents', form);
  const patch = {};
  if (fixture.title) {
    patch.title = fixture.title;
  }
  if (fixture.documentDate) {
    patch.documentDate = fixture.documentDate;
  }
  if (Object.keys(patch).length > 0) {
    await api(cookie, 'PATCH', `/v1/documents/${created.id}`, patch);
  }
  const doc = await waitDocumentPipeline(cookie, created.id);
  return { ...doc, ...patch, id: created.id };
}

async function createThread(cookie) {
  const out = await api(cookie, 'POST', '/v1/chat/threads', { title: 'smoke bench' });
  return out.thread.id;
}

async function sendAndStream(cookie, threadId, message) {
  const posted = await api(cookie, 'POST', `/v1/chat/threads/${threadId}/messages`, { message });
  const messageId = posted.assistantMessage.id;
  const headers = { origin: WEB_ORIGIN, cookie: cookie.split(';')[0] };
  const res = await fetch(
    `${AUTH_BASE}/v1/chat/threads/${threadId}/messages/${messageId}/stream`,
    { headers }
  );
  if (!res.ok) {
    throw new Error(`stream ${res.status}: ${await res.text()}`);
  }
  let finalContent = '';
  let generationStatus = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) {
        continue;
      }
      const event = JSON.parse(line.slice(5).trim());
      const msg = event.message ?? {};
      if (msg.content) {
        finalContent = String(msg.content);
      }
      if (event.type === 'done') {
        generationStatus = String(msg.generationStatus ?? 'done');
      }
      if (msg.generationStatus === 'error') {
        throw new Error(`chat generation error: ${msg.errorDetail ?? finalContent}`);
      }
    }
  }
  const messages = await api(cookie, 'GET', `/v1/chat/threads/${threadId}/messages`);
  const finalMsg = messages.messages.find((m) => m.id === messageId) ?? {};
  const citations = finalMsg.citations ?? [];
  return {
    generationStatus,
    content: String(finalMsg.content ?? finalContent),
    citations,
  };
}

function citationTitles(citations) {
  return citations.map((c) => c.documentTitle ?? c.documentId ?? '');
}

async function runChatChecks(cookie) {
  let threadId = await createThread(cookie);
  const results = [];
  for (const check of manifest.chatChecks) {
    if (check.newThread) {
      threadId = await createThread(cookie);
    }
    const out = await sendAndStream(cookie, threadId, check.question);
    const lower = out.content.toLowerCase();
    const abstained = lower.includes(ABSTENTION_SNIPPET);
    const titles = citationTitles(out.citations);
    let ok = true;
    if (check.expectAbstention) {
      ok = abstained && out.citations.length === 0;
    } else {
      ok = !abstained && out.generationStatus !== 'error';
      if (check.expectCitationTitleContains) {
        ok =
          ok &&
          titles.some((t) =>
            t.toLowerCase().includes(String(check.expectCitationTitleContains).toLowerCase())
          );
      }
      if (check.expectMinCitations != null) {
        ok = ok && out.citations.length >= check.expectMinCitations;
      }
      if (check.expectAnswerContainsAny) {
        ok =
          ok &&
          check.expectAnswerContainsAny.some((needle) =>
            out.content.toLowerCase().includes(String(needle).toLowerCase())
          );
      }
    }
    results.push({ id: check.id, ok, citations: out.citations.length, preview: out.content.slice(0, 120) });
    if (!ok) {
      console.error('Chat check failed', check.id, out);
    }
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    throw new Error(`Smoke chat checks failed: ${JSON.stringify(failed)}`);
  }
  console.log('Smoke chat checks passed:', results.map((r) => r.id).join(', '));
}

async function runDuplicateSmokeCheck(cookie, docsByTitle) {
  const spec = manifest.duplicateSmoke;
  if (!spec) {
    return;
  }
  const anchor = docsByTitle.get(spec.anchorTitle);
  const expectTitle = spec.expectPairTitle;
  if (!anchor) {
    throw new Error(`Duplicate smoke anchor not uploaded: ${spec.anchorTitle}`);
  }
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    const candidates = await api(cookie, 'GET', `/v1/documents/${anchor.id}/duplicate-candidates`);
    const hit = candidates.items.find(
      (row) =>
        row.source === 'smart' &&
        String(row.candidateTitle).toLowerCase().includes(String(expectTitle).toLowerCase())
    );
    if (hit) {
      console.log(
        `Smart duplicate smoke OK: ${anchor.id} -> ${hit.candidateDocumentId} (${Math.round(hit.similarity * 100)}%)`
      );
      return;
    }
    await sleep(2000);
  }
  throw new Error(`Smart duplicate smoke: no smart candidate for anchor ${anchor.id}`);
}

function syntheticPayrollFixtures() {
  const fixturesDir = join(here, 'fixtures');
  const out = [];
  for (const file of readdirSync(fixturesDir).sort()) {
    if (file.startsWith('payslip-') && file.endsWith('.pdf')) {
      const match = /^payslip-(\d{4})-(\d{2})\.pdf$/.exec(file);
      if (!match) {
        continue;
      }
      const year = match[1];
      const month = match[2];
      out.push({
        file,
        title: `Entgeltnachweis ${month}/${year}`,
        mime: 'application/pdf',
      });
    }
    if (file.startsWith('lohnsteuerbescheinigung-') && file.endsWith('.pdf')) {
      const year = file.replace('lohnsteuerbescheinigung-', '').replace('.pdf', '');
      out.push({
        file,
        title: `Lohnsteuerbescheinigung ${year}`,
        mime: 'application/pdf',
      });
    }
  }
  return out;
}

async function ensureTag(cookie, name) {
  const listed = await api(cookie, 'GET', '/v1/tags');
  const existing = (listed.items ?? []).find(
    (row) => String(row.name).toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    return existing;
  }
  return api(cookie, 'POST', '/v1/tags', { name, color: '#64748b' });
}

async function runHeaderDateAdoptionCheck(_cookie, docsByTitle) {
  const spec = manifest.headerDateAdoption;
  if (!spec) {
    return;
  }
  const doc = docsByTitle.get(spec.documentTitle);
  if (!doc) {
    throw new Error(`Header date doc missing: ${spec.documentTitle}`);
  }
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    const fresh = await api(_cookie, 'GET', `/v1/documents/${doc.id}`);
    if (fresh.documentDate === spec.expectDocumentDate) {
      console.log(
        `Header date adoption OK: ${spec.documentTitle} documentDate=${fresh.documentDate}`
      );
      return;
    }
    await sleep(2000);
  }
  throw new Error(
    `Header date adoption failed for ${spec.documentTitle}: expected ${spec.expectDocumentDate}`
  );
}

async function runLabelExclusivityCheck(cookie, docsByTitle) {
  const spec = manifest.labelExclusivity;
  if (!spec) {
    return;
  }
  const primaryTag = await ensureTag(cookie, spec.primaryTagName);
  const conflictingTag = await ensureTag(cookie, spec.conflictingTagName);

  for (const title of spec.primaryLabelTitles ?? []) {
    const doc = docsByTitle.get(title);
    if (!doc) {
      throw new Error(`Label exclusivity training doc missing: ${title}`);
    }
    await api(cookie, 'POST', `/v1/documents/${doc.id}/tags/${primaryTag.id}`);
  }
  for (const title of spec.conflictingLabelTitles ?? []) {
    const doc = docsByTitle.get(title);
    if (!doc) {
      throw new Error(`Label exclusivity training doc missing: ${title}`);
    }
    await api(cookie, 'POST', `/v1/documents/${doc.id}/tags/${conflictingTag.id}`);
  }

  const probe = docsByTitle.get(spec.probeTitle);
  if (!probe) {
    throw new Error(`Label exclusivity probe missing: ${spec.probeTitle}`);
  }
  await api(cookie, 'POST', `/v1/documents/${probe.id}/tags/${primaryTag.id}`);

  const deadline = Date.now() + WAIT_MS;
  const maxConf = spec.maxConflictingSuggestionConfidence ?? 0.899;
  while (Date.now() < deadline) {
    await api(cookie, 'POST', `/v1/documents/${probe.id}/tag-suggestions/refresh`);
    const fresh = await api(cookie, 'GET', `/v1/documents/${probe.id}`);
    const bad = (fresh.tagSuggestions ?? []).find(
      (row) =>
        row.tag?.id === conflictingTag.id &&
        (row.confidence ?? 0) >= maxConf + 1e-6
    );
    if (!bad) {
      const top = (fresh.tagSuggestions ?? [])
        .filter((row) => row.tag?.id === conflictingTag.id)
        .map((row) => row.confidence ?? 0);
      const topConf = top.length > 0 ? Math.max(...top) : 0;
      console.log(
        `Label exclusivity OK: probe ${spec.probeTitle} conflicting suggestion max confidence ${String(topConf)} (<=${String(maxConf)})`
      );
      return;
    }
    await sleep(4000);
  }
  throw new Error(
    `Label exclusivity failed: ${spec.conflictingTagName} suggestion >= ${String(maxConf)} on labeled probe`
  );
}

async function runPayrollFieldLearning(cookie, docsByTitle) {
  const spec = manifest.payrollFieldLearning;
  if (!spec) {
    return;
  }
  await api(cookie, 'PUT', '/v1/recognized-fields', {
    items: [
      {
        key: spec.fieldKey,
        label: 'Bruttoentgelt',
        fieldType: 'currency',
        sortOrder: 0,
        extractForAllDocuments: true,
        gateLabelIds: [],
        gateLabelMatch: 'any',
        minLabelConfidence: null,
        confidenceGateEnabled: null,
      },
    ],
  });
  for (const title of spec.correctionTitles) {
    const doc = docsByTitle.get(title);
    if (!doc) {
      throw new Error(`Field learning correction doc missing: ${title}`);
    }
    const fields = [
      ...(doc.extraction?.fields ?? []).filter((row) => row.key !== spec.fieldKey),
      { key: spec.fieldKey, value: spec.correctionValue, confidence: 1 },
    ];
    await api(cookie, 'PATCH', `/v1/documents/${doc.id}`, { extractionFields: fields });
  }
  const probe = docsByTitle.get(spec.probeTitle);
  if (!probe) {
    throw new Error(`Field learning probe doc missing: ${spec.probeTitle}`);
  }
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    const fresh = await api(cookie, 'GET', `/v1/documents/${probe.id}`);
    const hit = (fresh.extraction?.fields ?? []).find(
      (row) => row.key === spec.fieldKey || row.key === `global:${spec.fieldKey}`
    );
    if (hit?.value === spec.expectedProbeValue) {
      console.log(`Payroll field learning OK on ${spec.probeTitle}: ${hit.value}`);
      return;
    }
    await sleep(3000);
  }
  throw new Error(`Field learning timeout: expected ${spec.expectedProbeValue} on ${spec.probeTitle}`);
}

async function main() {
  const cookie = await signIn();
  const docsById = new Map();
  const docsByTitle = new Map();
  const allFixtures = [...manifest.fixtures, ...syntheticPayrollFixtures()];
  for (const fixture of allFixtures) {
    const doc = await uploadFixture(cookie, fixture);
    docsById.set(doc.id, doc);
    if (doc.title) {
      docsByTitle.set(doc.title, doc);
    }
    console.log(`Uploaded ${fixture.file} -> ${doc.id} (${doc.status})`);
  }
  await runDuplicateSmokeCheck(cookie, docsByTitle);
  await runHeaderDateAdoptionCheck(cookie, docsByTitle);
  await runLabelExclusivityCheck(cookie, docsByTitle);
  await runPayrollFieldLearning(cookie, docsByTitle);
  await runChatChecks(cookie);
  console.log('Smoke seed-and-verify OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
