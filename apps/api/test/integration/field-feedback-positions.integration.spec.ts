// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { hashLayoutIrHex } from '../../src/modules/document-regions/domain/ir-hash.js';
import { PgDocumentRegionRepository } from '../../src/modules/document-regions/infrastructure/pg-document-region.repository.js';
import { PgDocumentRepository } from '../../src/modules/documents/infrastructure/pg-document.repository.js';
import { PersistDocumentFactsUseCase } from '../../src/modules/exact-facts/application/persist-document-facts.use-case.js';
import { PgDocumentExtractedFactRepository } from '../../src/modules/exact-facts/infrastructure/pg-document-extracted-fact.repository.js';
import { ExportFieldTrainingExamplesUseCase } from '../../src/modules/extraction-feedback/application/export-field-training-examples.use-case.js';
import { RecordExtractionFieldCorrectionsUseCase } from '../../src/modules/extraction-feedback/application/record-extraction-field-corrections.use-case.js';
import { ResolveConfirmationPositionsService } from '../../src/modules/extraction-feedback/application/resolve-confirmation-positions.service.js';
import { PgExtractionFieldFeedbackRepository } from '../../src/modules/extraction-feedback/infrastructure/pg-extraction-field-feedback.repository.js';
import { PgFieldFeedbackAnchorReader } from '../../src/modules/extraction-feedback/infrastructure/pg-field-feedback-anchor.reader.js';
import { PgTagCustomFieldRepository } from '../../src/modules/labels/infrastructure/pg-tag-custom-field.repository.js';
import { PgRecognizedFieldRepository } from '../../src/modules/recognized-fields/infrastructure/pg-recognized-field.repository.js';
import { PgTaxonomyRepository } from '../../src/modules/taxonomy/infrastructure/pg-taxonomy.repository.js';
import type { FieldTrainingExample } from '../../src/shared/domain/ports.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

const IR = {
  version: 1,
  pages: [
    {
      page: 1,
      widthPt: 595,
      heightPt: 842,
      blocks: [{ page: 1, x: 0.5, y: 0.1, width: 0.2, height: 0.05, text: '12,50', blockIndex: 7 }],
    },
  ],
};

describe('field feedback positions (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  const feedback = new PgExtractionFieldFeedbackRepository(pool);
  const documents = new PgDocumentRepository(pool);
  const record = new RecordExtractionFieldCorrectionsUseCase(
    documents,
    new PgTaxonomyRepository(pool),
    feedback,
    new ResolveConfirmationPositionsService(new PgFieldFeedbackAnchorReader(pool))
  );
  const exporter = new ExportFieldTrainingExamplesUseCase(
    feedback,
    new PgRecognizedFieldRepository(pool),
    new PgTagCustomFieldRepository(pool)
  );
  let userA: string;
  let userB: string;
  const documentA = randomUUID();

  async function exportAll(userId: string): Promise<FieldTrainingExample[]> {
    const rows: FieldTrainingExample[] = [];
    for await (const example of exporter.execute(userId, 2)) {
      rows.push(example);
    }
    return rows;
  }

  beforeAll(async () => {
    userA = newIsolationUserId();
    userB = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userA, name: 'A', email: `${userA}@example.test` });
      await insertSyntheticUser(client, { id: userB, name: 'B', email: `${userB}@example.test` });
    } finally {
      client.release();
    }
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'p.pdf', 'application/pdf', 'k', 'ready')`,
      [documentA, userA]
    );
    await pool.query(
      `INSERT INTO document_layout_ir (document_id, version, ir, ir_sha256)
       VALUES ($1, 1, $2::jsonb, decode($3, 'hex'))`,
      [documentA, JSON.stringify(IR), hashLayoutIrHex(IR)]
    );
    await new PersistDocumentFactsUseCase(new PgDocumentExtractedFactRepository(pool)).execute(
      userA,
      documentA,
      [
        {
          kind: 'key_value',
          predicateKey: 'absender',
          confidence: 0.7,
          provenance: {
            page: 1,
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.05,
            charStart: 10,
            charEnd: 23,
          },
          valueText: 'Nordwind GmbH',
        },
      ],
      1.5
    );
    await new PgDocumentRegionRepository(pool).insertRegion({
      id: randomUUID(),
      documentId: documentA,
      page: 1,
      shape: 'rect',
      role: 'field',
      x0: 0.5,
      y0: 0.1,
      x1: 0.7,
      y1: 0.15,
      irSha256: hashLayoutIrHex(IR),
      blockIndexes: [7],
      boundText: '12,50',
      fieldKey: 'global:betrag',
      valueOverride: '12,50',
    });
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userA);
    await deleteSyntheticUser(pool, userB);
    await closeIntegrationPool();
  });

  it('confirms with the model fact span and the user region', async () => {
    const before = [
      { key: 'global:absender', value: 'Nordwind GmbH', confidence: 0.7 },
      { key: 'global:betrag', value: '12,50', confidence: 0.6 },
    ];
    const after = before.map((field) => ({ ...field, confidence: 1 }));
    await documents.updateForUser(documentA, userA, { extractionFields: before });
    const result = await record.execute(documentA, userA, before, after);
    expect(result.confirmationsRecorded).toBe(2);

    const examples = await exportAll(userA);
    const vendor = examples.find((row) => row.value === 'Nordwind GmbH');
    expect(vendor?.kind).toBe('confirmation');
    expect(vendor?.position).toMatchObject({
      source: 'model_fact',
      page: 1,
      docCharStart: 10,
      docCharEnd: 23,
    });
    expect(vendor?.position?.bbox?.x1).toBeCloseTo(0.4, 5);
    const amount = examples.find((row) => row.value === '12,50');
    expect(amount?.position).toMatchObject({
      source: 'user_region',
      page: 1,
      docCharStart: null,
      blockIndexes: [7],
    });
  });

  it('stores a correction with the user-marked span', async () => {
    await feedback.insertCorrectionsIdempotent(userA, [
      {
        documentId: documentA,
        fieldKey: 'global:betrag',
        oldValue: '12,50',
        newValue: '12,90',
        labelTagIds: [],
        fieldTagId: null,
        position: {
          source: 'user_region',
          page: 1,
          docCharStart: null,
          docCharEnd: null,
          bbox: { x0: 0.5, y0: 0.1, x1: 0.7, y1: 0.15 },
          blockIndexes: [7],
        },
      },
    ]);
    const corrected = (await exportAll(userA)).find((row) => row.value === '12,90');
    expect(corrected?.kind).toBe('correction');
    expect(corrected?.position).toMatchObject({ source: 'user_region', blockIndexes: [7] });
  });

  it('stores a typed correction without any position', async () => {
    const before = [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 }];
    const after = [{ key: 'global:absender', value: 'Südwind AG', confidence: 1 }];
    await documents.updateForUser(documentA, userA, { extractionFields: before });
    const result = await record.execute(documentA, userA, before, after);
    expect(result.correctionsRecorded).toBe(1);
    const corrected = (await exportAll(userA)).find((row) => row.value === 'Südwind AG');
    expect(corrected?.kind).toBe('correction');
    expect(corrected?.position).toBeNull();
  });

  it('links all spellings of a field to one canonical name', async () => {
    const names = await pool.query<{ c: number }>(
      `SELECT COUNT(DISTINCT field_name_id)::int AS c FROM (
         SELECT field_name_id FROM extraction_field_corrections WHERE user_id = $1
         UNION ALL
         SELECT field_name_id FROM extraction_field_confirmations WHERE user_id = $1
       ) ids`,
      [userA]
    );
    expect(names.rows[0]?.c).toBe(2);
  });

  it('isolates tenants in export and position lookup', async () => {
    expect(await exportAll(userB)).toEqual([]);
    const anchors = await new PgFieldFeedbackAnchorReader(pool).listAnchors(userB, documentA);
    expect(anchors).toEqual({ regions: [], facts: [] });
  });
});
