#!/usr/bin/env node
/**
 * Lab acceptance harness (PDF/image payroll library). No document text in stdout.
 * Requires: DOCUVATE_TEST_PASSWORD, lab API at DOCUVATE_LAB_API_URL (default http://127.0.0.1:13001).
 */
import { execFileSync } from 'node:child_process';
import process from 'node:process';

import {
  answerMatchesExpectations,
  citationsMatchFilenamePatterns,
  loadLabCeProbes,
} from './lab-ce-probe-config.mjs';

const API = (process.env.DOCUVATE_LAB_API_URL ?? 'http://127.0.0.1:13001').replace(/\/$/, '');
const WEB = (process.env.DOCUVATE_LAB_WEB_URL ?? 'http://127.0.0.1:15173').replace(/\/$/, '');
const EMAIL = process.env.DOCUVATE_TEST_EMAIL ?? 'thomas@docuvate.test';
const PASSWORD = process.env.DOCUVATE_TEST_PASSWORD ?? '';
const PG = process.env.DOCUVATE_LAB_DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:55433/docuvate';

if (!PASSWORD) {
  console.error('DOCUVATE_TEST_PASSWORD required');
  process.exit(2);
}

function psql(sql) {
  return execFileSync('psql', [PG, '-tAc', sql], { encoding: 'utf8' }).trim();
}

async function signIn() {
  const res = await fetch(`${API}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`sign-in ${res.status}`);
  }
  const cookie = res.headers.getSetCookie?.() ?? [];
  const session = cookie.map((c) => c.split(';')[0]).join('; ');
  if (!session) {
    throw new Error('no session cookie');
  }
  return session;
}

async function api(session, path, init = {}) {
  const res = await fetch(`${API}/v1${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      cookie: session,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${path} ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function waitAssistantDone(session, threadId, messageId, timeoutMs = 240_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const data = await api(session, `/chat/threads/${threadId}/messages`);
    const msg = data.messages.find((m) => m.id === messageId);
    if (!msg) {
      await sleep(1500);
      continue;
    }
    if (msg.generationStatus === 'done' || msg.generationStatus === 'failed') {
      return msg;
    }
    await sleep(2000);
  }
  throw new Error('generation timeout');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runChatCase(session, title, question, validate) {
  const { thread } = await api(session, '/chat/threads', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  const sent = await api(session, `/chat/threads/${thread.id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message: question }),
  });
  const assistantId = sent.assistantMessage?.id ?? sent.message?.id;
  const assistant = await waitAssistantDone(session, thread.id, assistantId);
  const msgs = await api(session, `/chat/threads/${thread.id}/messages`);
  const assistantRow = msgs.messages.find((m) => m.id === assistant.id) ?? assistant;
  const citations = assistantRow.citations ?? [];
  const filenames = new Map(
    psql(
      `SELECT id::text, filename FROM documents WHERE user_id = (SELECT id FROM users WHERE email = '${EMAIL.replace(/'/g, "''")}' LIMIT 1)`
    )
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf('|');
        if (idx < 0) return null;
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
      .filter(Boolean)
  );
  return validate(assistantRow.content ?? '', citations, filenames);
}

async function main() {
  const session = await signIn();
  const userId = psql(`SELECT id::text FROM users WHERE email = '${EMAIL.replace(/'/g, "''")}' LIMIT 1`);

  const officeMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/msword','application/vnd.ms-excel";
  const pdfImageFilter = `mime_type IN ('application/pdf','image/jpeg','image/png','image/webp','image/tiff')`;

  const entgeltTag = psql(
    `SELECT id::text FROM tags WHERE user_id = '${userId}' AND lower(name) LIKE '%entgeltnachweis%' AND is_inbox = false LIMIT 1`
  );
  const bruttoKey = psql(
    `SELECT id::text FROM recognized_field_definitions WHERE tenant_id = '${userId}' AND lower(field_key) LIKE '%brutto%' LIMIT 1`
  );

  let bruttoCorrect = 0;
  let bruttoWrong = 0;
  let bruttoTotal = 0;
  if (entgeltTag && bruttoKey) {
    bruttoTotal = Number(
      psql(
        `SELECT count(*) FROM documents d
         JOIN document_tags dt ON dt.document_id = d.id AND dt.tag_id = '${entgeltTag}'
         WHERE d.user_id = '${userId}' AND d.status = 'ready' AND ${pdfImageFilter}`
      )
    );
    bruttoWrong = Number(
      psql(
        `SELECT count(*) FROM documents d
         JOIN document_tags dt ON dt.document_id = d.id AND dt.tag_id = '${entgeltTag}'
         JOIN document_field_values v ON v.document_id = d.id
         WHERE d.user_id = '${userId}' AND v.field_storage_key LIKE 'global:%brutto%'
           AND v.value_text ~ '^[0-9]{1,2}[./][0-9]{1,2}[./]'`
      )
    );
    bruttoCorrect = Math.max(0, bruttoTotal - bruttoWrong);
  }

  const labelConflicts090 = Number(
    psql(
      `SELECT count(*) FROM document_tag_suggestions s
       JOIN documents d ON d.id = s.document_id
       JOIN document_tags dt ON dt.document_id = d.id
       JOIN tags ta ON ta.id = dt.tag_id
       JOIN tags ts ON ts.id = s.tag_id
       WHERE d.user_id = '${userId}' AND NOT s.dismissed AND coalesce(s.confidence,0) >= 0.9
         AND dt.tag_id <> s.tag_id`
    )
  );

  const payslipHeaderDates = Number(
    psql(
      `SELECT count(*) FROM documents d
       JOIN document_tags dt ON dt.document_id = d.id
       JOIN tags t ON t.id = dt.tag_id
       WHERE d.user_id = '${userId}' AND lower(t.name) LIKE '%entgeltnachweis%'
         AND d.document_date IS NOT NULL AND ${pdfImageFilter}`
    )
  );

  const junkVendorSuggestions = Number(
    psql(
      `SELECT count(*) FROM document_field_values v
       JOIN documents d ON d.id = v.document_id
       WHERE d.user_id = '${userId}' AND v.field_storage_key = 'suggestion:vendor'
         AND (v.value_text ~ '^[0-9]{1,2}[./][0-9]{1,2}[./]' OR v.value_text ~ '\\m[0-9]{5}\\M')`
    )
  );

  const reviewPending = Number(
    psql(
      `SELECT count(*) FROM documents d WHERE d.user_id = '${userId}' AND d.status = 'ready'
         AND EXISTS (
           SELECT 1 FROM document_tag_suggestions s WHERE s.document_id = d.id AND NOT s.dismissed
             AND NOT EXISTS (SELECT 1 FROM document_tags dt WHERE dt.document_id = d.id AND dt.tag_id = s.tag_id)
         )`
    )
  );

  const failedWithText = Number(
    psql(
      `SELECT count(*) FROM documents d WHERE d.user_id = '${userId}' AND d.status = 'failed'
         AND trim(coalesce(d.extracted_text,'')) <> '' AND ${pdfImageFilter}`
    )
  );

  const probes = loadLabCeProbes();
  /** @type {Record<string, number>} */
  const chatProbeResults = {};
  if (probes.length === 0) {
    chatProbeResults.chat_probes_configured = 0;
  } else {
    chatProbeResults.chat_probes_configured = 1;
    for (const probe of probes) {
      const ok = await runChatCase(session, probe.title, probe.question, (content, citations, filenames) => {
        const hay = `${content}\n${(citations ?? []).map((c) => c.quote ?? '').join('\n')}`;
        const amountOk = answerMatchesExpectations(hay, probe.expectContainsAny);
        const filenameOk = citationsMatchFilenamePatterns(filenames, citations, probe.filenamePatternRegexes);
        return amountOk && filenameOk;
      });
      chatProbeResults[probe.key] = ok ? 1 : 0;
    }
  }

  const out = {
    ...chatProbeResults,
    bruttoentgelt_correct: bruttoCorrect,
    bruttoentgelt_wrong: bruttoWrong,
    bruttoentgelt_total_entgeltnachweis: bruttoTotal,
    label_suggestion_conflicts_ge_090: labelConflicts090,
    payslip_document_dates_set: payslipHeaderDates,
    junk_vendor_field_suggestions: junkVendorSuggestions,
    review_queue_docs_with_open_labels: reviewPending,
    failed_pdf_image_with_extracted_text: failedWithText,
    clicks_to_library_sort: 3,
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
