// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import type pg from 'pg';

import { withTenantPgClient } from '../../../src/shared/infrastructure/database/tenant-pg.js';

const READY_COUNT = 620;
const FAILED_COUNT = 140;
const QUEUED_COUNT = 140;
const TAG_COUNT = 120;
const TAGS_PER_READY_DOC = 5;
const EMBED_BYTES = 8;

export interface LabelsRecommendationsAuditSeed {
  userId: string;
  tagIds: string[];
  readyDocIds: string[];
  apiKeySecret: string;
}

function pseudoEmbedding(seed: number): Buffer {
  const buf = Buffer.alloc(EMBED_BYTES);
  for (let i = 0; i < EMBED_BYTES; i += 1) {
    buf.writeInt8(i, ((seed + i * 17) % 251) - 125);
  }
  return buf;
}

export async function seedLabelsRecommendationsAudit(
  pool: pg.Pool,
  userId: string
): Promise<LabelsRecommendationsAuditSeed> {
  const tagIds: string[] = [];
  for (let i = 0; i < TAG_COUNT; i += 1) {
    tagIds.push(randomUUID());
  }

  const client = await pool.connect();
  try {
    const tagValues: string[] = [];
    const tagParams: (string | boolean)[] = [];
    let p = 1;
    for (let i = 0; i < TAG_COUNT; i += 1) {
      tagValues.push(`($${String(p)}, $${String(p + 1)}, $${String(p + 2)}, '#64748b', false)`);
      tagParams.push(tagIds[i], userId, `Label ${String(i)}`);
      p += 3;
    }
    await client.query(
      `INSERT INTO tags (id, user_id, name, color, is_inbox) VALUES ${tagValues.join(', ')}`,
      tagParams
    );
  } finally {
    client.release();
  }

  const readyDocIds: string[] = [];
  const allDocRows: {
    id: string;
    status: string;
    text: string | null;
    documentDate: string | null;
  }[] = [];

  for (let i = 0; i < READY_COUNT; i += 1) {
    const id = randomUUID();
    readyDocIds.push(id);
    const text =
      i % 17 === 0
        ? ''
        : `Document body ${String(i)} with enough extracted text for label recommendations audit seed.`;
    const documentDate =
      i % 23 === 0 ? null : i % 29 === 0 ? '2019-06-15' : '2024-03-01';
    allDocRows.push({ id, status: 'ready', text, documentDate });
  }
  for (let i = 0; i < FAILED_COUNT; i += 1) {
    allDocRows.push({
      id: randomUUID(),
      status: 'failed',
      text: i % 5 === 0 ? null : 'failed extraction text',
      documentDate: null,
    });
  }
  for (let i = 0; i < QUEUED_COUNT; i += 1) {
    allDocRows.push({
      id: randomUUID(),
      status: 'queued',
      text: null,
      documentDate: null,
    });
  }

  const batchSize = 100;
  for (let offset = 0; offset < allDocRows.length; offset += batchSize) {
    const slice = allDocRows.slice(offset, offset + batchSize);
    const values: string[] = [];
    const params: (string | null)[] = [];
    let idx = 1;
    for (const row of slice) {
      values.push(
        `($${String(idx)}, $${String(idx + 1)}, $${String(idx + 2)}, 'application/pdf', 'storage/${String(idx)}', $${String(idx + 3)}, $${String(idx + 4)}, $${String(idx + 5)}, $${String(idx + 6)})`
      );
      params.push(
        row.id,
        userId,
        `file-${row.id.slice(0, 8)}.pdf`,
        row.status,
        row.text,
        `Title ${row.id.slice(0, 8)}`,
        row.documentDate
      );
      idx += 7;
    }
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status, extracted_text, title, document_date)
       VALUES ${values.join(', ')}`,
      params
    );
  }

  const tagLinkValues: string[] = [];
  const tagLinkParams: (string | boolean)[] = [];
  let tp = 1;
  for (let d = 0; d < readyDocIds.length; d += 1) {
    const docId = readyDocIds[d];
    for (let t = 0; t < TAGS_PER_READY_DOC; t += 1) {
      const tagId = tagIds[(d + t) % TAG_COUNT];
      const confirmed = t < 2;
      tagLinkValues.push(`($${String(tp)}, $${String(tp + 1)}, $${String(tp + 2)})`);
      tagLinkParams.push(docId, tagId, confirmed);
      tp += 3;
    }
  }
  await pool.query(
    `INSERT INTO document_tags (document_id, tag_id, user_confirmed) VALUES ${tagLinkValues.join(', ')}`,
    tagLinkParams
  );

  await withTenantPgClient(pool, userId, async (tenantClient) => {
    const repValues: string[] = [];
    const repParams: (string | Buffer | number)[] = [];
    let rp = 1;
    for (let i = 0; i < readyDocIds.length; i += 1) {
      if (i % 17 === 0) {
        continue;
      }
      const docId = readyDocIds[i];
      const bytes = pseudoEmbedding(i);
      repValues.push(
        `($${String(rp)}, $${String(rp + 1)}, 'intfloat/multilingual-e5-small', 'rev', 1, 0.01, $${String(rp + 2)}, 0.01, $${String(rp + 2)})`
      );
      repParams.push(docId, userId, bytes);
      rp += 3;
    }
    await tenantClient.query(
      `INSERT INTO document_representation (
         document_id, tenant_id, encoder_id, encoder_revision, representation_version,
         document_mean_scale, document_mean_int8, document_max_scale, document_max_int8
       ) VALUES ${repValues.join(', ')}`,
      repParams
    );
  });

  const apiKeySecret = `labels-audit-${randomUUID()}`;
  process.env.DOCUVATE_SERVICE_API_KEYS = JSON.stringify([
    {
      keyId: 'labels-audit',
      secret: apiKeySecret,
      tenantUserId: userId,
      roles: ['integrator'],
      claims: ['document:*'],
    },
  ]);

  return { userId, tagIds, readyDocIds, apiKeySecret };
}
