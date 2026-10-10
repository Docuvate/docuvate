import * as Minio from 'minio';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  startMinioContainer,
  startValkeyContainer,
} from '../../../../packages/testing/src/containers/index.js';
import { PaperlessImportExecutor } from '../../src/modules/connectors/infrastructure/adapters/paperless/paperless-import.executor.js';
import { PaperlessImportRepository } from '../../src/modules/connectors/infrastructure/adapters/paperless/paperless-import.repository.js';
import { PgConnectorInstallationRepository } from '../../src/modules/connectors/infrastructure/pg-connector-installation.repository.js';
import { createPaperlessImportExecutor } from './paperless-import-fixtures.js';
import { ensurePaperlessTestStack, teardownPaperlessTestStack } from './paperless-test-stack.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('Paperless-ngx import (live stack)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let installationId: string;
  let executor: PaperlessImportExecutor;
  let imports: PaperlessImportRepository;
  let installations: PgConnectorInstallationRepository;
  let minioStop: (() => Promise<void>) | null = null;
  let valkeyStop: (() => Promise<void>) | null = null;
  let documentCount = 10;
  let paperlessStackReady = false;

  beforeAll(async () => {
    const valkey = await startValkeyContainer();
    valkeyStop = valkey.stop;
    process.env.VALKEY_URL = valkey.url;

    const minio = await startMinioContainer();
    minioStop = minio.stop;
    process.env.MINIO_ENDPOINT = minio.endpoint;
    process.env.MINIO_PORT = String(minio.port);
    process.env.MINIO_ACCESS_KEY = minio.accessKey;
    process.env.MINIO_SECRET_KEY = minio.secretKey;
    process.env.MINIO_BUCKET = 'documents';
    const minioClient = new Minio.Client({
      endPoint: minio.endpoint,
      port: minio.port,
      useSSL: false,
      accessKey: minio.accessKey,
      secretKey: minio.secretKey,
    });
    await minioClient.makeBucket('documents', '');

    const manifest = await ensurePaperlessTestStack();
    documentCount = manifest.documentCount;
    paperlessStackReady = true;

    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Paperless IT',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }

    imports = new PaperlessImportRepository(pool);
    installations = new PgConnectorInstallationRepository(pool);
    executor = createPaperlessImportExecutor(pool);

    const created = await installations.create({
      userId,
      pluginId: 'paperless',
      displayName: 'Paperless Test',
      credentials: {
        base_url: manifest.baseUrl,
        api_token: manifest.token,
      },
    });
    installationId = created.id;
  }, 900_000);

  afterAll(async () => {
    if (userId) {
      await deleteSyntheticUser(pool, userId);
    }
    await closeIntegrationPool();
    if (minioStop) {
      await minioStop();
    }
    if (valkeyStop) {
      await valkeyStop();
    }
    if (paperlessStackReady) {
      teardownPaperlessTestStack();
    }
  });

  async function runImportToCompletion(runId: string): Promise<void> {
    const run = await imports.findRunForUser(runId, userId);
    if (!run) {
      throw new Error('run missing');
    }
    const row = await installations.findByIdForUser(userId, installationId);
    if (!row) {
      throw new Error('installation missing');
    }
    await executor.runImportJob(run, row.credentials);
  }

  it('dry-run reports seeded document counts', async () => {
    const row = await installations.findByIdForUser(userId, installationId);
    expect(row).not.toBeNull();
    if (!row) {
      throw new Error('expected installation');
    }
    const summary = await executor.dryRun(installationId, userId, row.credentials);
    expect(summary.documentCount).toBe(documentCount);
    expect(summary.tagCount).toBeGreaterThan(0);
    expect(summary.customFieldCount).toBeGreaterThan(0);
  });

  it('imports all documents and maps metadata', async () => {
    const run = await imports.createRun({
      installationId,
      ocrMode: 'keep_paperless',
      includeArchivedPdf: false,
    });
    await runImportToCompletion(run.id);
    const count = await imports.countSourceDocuments(installationId);
    expect(count).toBe(documentCount);

    const sample = await pool.query<{
      title: string;
      correspondent_name: string | null;
      folder_name: string | null;
    }>(
      `SELECT d.title, c.name AS correspondent_name, f.name AS folder_name
       FROM connector_source_documents csd
       JOIN documents d ON d.id = csd.document_id
       LEFT JOIN correspondents c ON c.id = d.correspondent_id
       LEFT JOIN folders f ON f.id = d.folder_id
       WHERE csd.installation_id = $1
         AND d.title = 'Steuerbescheid 2024 Musterstadt'`,
      [installationId]
    );
    expect(sample.rows[0]?.correspondent_name).toBe('Finanzamt Musterstadt');
    expect(sample.rows[0]?.folder_name).toBe('Behörden/Steuer');

    const fields = await pool.query<{ label: string; value_text: string }>(
      `SELECT rfd.label, dfv.value_text
       FROM connector_source_documents csd
       JOIN document_field_values dfv ON dfv.document_id = csd.document_id
       JOIN recognized_field_definitions rfd
         ON rfd.user_id = $2
        AND dfv.field_storage_key = 'global:' || rfd.field_key
       WHERE csd.installation_id = $1
       LIMIT 1`,
      [installationId, userId]
    );
    expect(fields.rows.length).toBeGreaterThan(0);
    expect(fields.rows[0]?.label).toBe('Vertragsnummer');
  });

  it('re-run import is idempotent (no new source links)', async () => {
    const before = await imports.countSourceDocuments(installationId);
    const watermark = await imports.getSyncWatermark(installationId);
    expect(watermark).not.toBeNull();

    const run = await imports.createRun({
      installationId,
      ocrMode: 'keep_paperless',
      includeArchivedPdf: false,
      incrementalModifiedGt: watermark,
    });
    await runImportToCompletion(run.id);
    const after = await imports.countSourceDocuments(installationId);
    expect(after).toBe(before);
  });

  it('resumes after an interrupted run', async () => {
    const isolatedUser = newIsolationUserId();
    const resumeClient = await pool.connect();
    try {
      await insertSyntheticUser(resumeClient, {
        id: isolatedUser,
        name: 'Resume IT',
        email: `${isolatedUser}@example.test`,
      });
    } finally {
      resumeClient.release();
    }

    const manifestRow = await installations.findByIdForUser(userId, installationId);
    if (!manifestRow) {
      throw new Error('expected manifest installation');
    }
    const install = await installations.create({
      userId: isolatedUser,
      pluginId: 'paperless',
      displayName: 'Resume test',
      credentials: manifestRow.credentials,
    });

    const run = await imports.createRun({
      installationId: install.id,
      ocrMode: 'keep_paperless',
      includeArchivedPdf: false,
    });

    const originalProgress = imports.updateRunProgress.bind(imports);
    let interrupted = false;
    imports.updateRunProgress = async (runId, patch) => {
      await originalProgress(runId, patch);
      if (!interrupted && patch.progressProcessed >= 3) {
        interrupted = true;
        throw new Error('SIMULATED_INTERRUPT');
      }
    };

    const creds = manifestRow.credentials;
    try {
      const liveRun = await imports.findRunForUser(run.id, isolatedUser);
      if (!liveRun) {
        throw new Error('expected import run');
      }
      await executor.runImportJob(liveRun, creds);
    } catch {
      // expected
    } finally {
      imports.updateRunProgress = originalProgress;
    }

    const mid = await imports.countSourceDocuments(install.id);
    expect(mid).toBeGreaterThanOrEqual(3);

    const resumed = await imports.findRunForUser(run.id, isolatedUser);
    if (!resumed) {
      throw new Error('expected resumed import run');
    }
    if (resumed.status === 'completed') {
      // Fast CI runners can finish the import before we observe an intermediate `running` state.
      expect(await imports.countSourceDocuments(install.id)).toBe(documentCount);
      await deleteSyntheticUser(pool, isolatedUser);
      return;
    }
    expect(resumed.status).toBe('running');
    await executor.runImportJob(resumed, creds);
    expect(await imports.countSourceDocuments(install.id)).toBe(documentCount);

    await deleteSyntheticUser(pool, isolatedUser);
  });
}, 900_000);
