// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import type pg from 'pg';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { validateScanFile } from '../../sftp-ingress/domain/scan-file-validation.js';
import { UploadDocumentUseCase } from '../../documents/application/upload-document.use-case.js';
import { ConnectorRuntimeResolver } from './connector-runtime.resolver.js';
import { decryptConnectorCredentials } from '../infrastructure/connector-secrets.codec.js';
import { postProcessSftpPullFile } from '../infrastructure/adapters/sftp/sftp-pull.gateway.js';

interface SftpInstallationRow {
  id: string;
  user_id: string;
  credentials_encrypted: Buffer;
}

@Injectable()
export class SftpFetchSyncService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SftpFetchSyncService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly runtime: ConnectorRuntimeResolver,
    private readonly uploadDocument: UploadDocumentUseCase
  ) {}

  onApplicationBootstrap(): void {
    const intervalMs = Number(process.env['DOCUVATE_SFTP_FETCH_SYNC_INTERVAL_MS'] ?? 60_000);
    if (intervalMs <= 0) return;
    const runTick = () => {
      void this.tick().catch((err) => {
        this.logger.warn(`SFTP fetch sync tick failed: ${String(err)}`);
      });
    };
    this.timer = setInterval(runTick, intervalMs);
    runTick();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const { rows } = await this.pool.query<SftpInstallationRow>(
        `SELECT id, user_id, credentials_encrypted
         FROM connector_installations
         WHERE plugin_id = 'sftp_fetch' AND enabled = true`
      );
      for (const row of rows) {
        try {
          await this.syncInstallation(
            row.id,
            row.user_id,
            decryptConnectorCredentials(row.credentials_encrypted)
          );
        } catch (err) {
          this.logger.warn(`SFTP pull sync failed for installation ${row.id}: ${String(err)}`);
          await this.updateSyncState(row.id, 'connectors.sftpFetch.syncFailed', null);
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async syncInstallation(
    installationId: string,
    userId: string,
    credentials: Record<string, string>
  ): Promise<void> {
    const pollSeconds = Number(credentials['poll_interval_seconds'] ?? 60);
    const pollMs = Number.isFinite(pollSeconds) && pollSeconds >= 60 ? pollSeconds * 1000 : 60_000;
    const lastRun = await this.pool.query<{ last_run_at: Date | null }>(
      `SELECT last_run_at FROM sftp_pull_sync_state WHERE installation_id = $1`,
      [installationId]
    );
    const lastRunAt = lastRun.rows[0]?.last_run_at;
    if (lastRunAt && Date.now() - lastRunAt.getTime() < pollMs) {
      return;
    }

    const lockKey = advisoryKey(installationId);
    const locked = await this.pool.query<{ locked: boolean }>(
      `SELECT pg_try_advisory_lock($1, $2) AS locked`,
      [lockKey.high, lockKey.low]
    );
    if (!locked.rows[0]?.locked) {
      return;
    }
    try {
      await this.runSync(installationId, userId, credentials);
      await this.updateSyncState(installationId, null, new Date());
    } finally {
      await this.pool.query(`SELECT pg_advisory_unlock($1, $2)`, [lockKey.high, lockKey.low]);
    }
  }

  private async runSync(
    installationId: string,
    userId: string,
    credentials: Record<string, string>
  ): Promise<void> {
    const resolved = await this.runtime.resolve(userId, installationId);
    if (!resolved.ports.source) return;
    const importables = await resolved.ports.source.listImportables({ limit: 20 });
    const afterImport = credentials['after_import']?.trim() || 'delete';
    const archiveSubpath = credentials['archive_subpath']?.trim() || 'imported';
    const folderId = credentials['target_folder_id']?.trim() || null;
    const labelIds = credentials['label_ids']
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const maxBytes = Number(process.env['DOCUVATE_SFTP_INGEST_MAX_BYTES'] ?? 26_214_400);
    const processed = await this.loadProcessedRefs(installationId);

    for (const item of importables) {
      if (processed.has(item.ref)) {
        continue;
      }
      try {
        const blob = await resolved.ports.source.fetchImportable(item.ref);
        const validation = validateScanFile(blob.filename, blob.buffer, maxBytes);
        if (!validation.ok) {
          await this.quarantineRemote(
            credentials,
            item.ref,
            blob.filename,
            afterImport,
            archiveSubpath
          );
          processed.add(item.ref);
          await this.saveProcessedRefs(installationId, processed);
          continue;
        }
        await this.uploadDocument.execute({
          userId,
          filename: validation.filename,
          mimeType: validation.mimeType,
          buffer: blob.buffer,
          folderId,
          tagIds: labelIds?.length ? labelIds : undefined,
          ingestSource: 'scanner_sftp',
        });
        try {
          await postProcessSftpPullFile(
            credentials,
            item.ref,
            blob.filename,
            afterImport,
            archiveSubpath
          );
          processed.add(item.ref);
          await this.saveProcessedRefs(installationId, processed);
        } catch (err) {
          processed.add(item.ref);
          await this.saveProcessedRefs(installationId, processed);
          await this.updateSyncState(
            installationId,
            'connectors.sftpFetch.postProcessFailed',
            null
          );
          this.logger.warn(
            `SFTP post-process failed for ${installationId}/${item.ref}: ${String(err)}`
          );
        }
      } catch (err) {
        this.logger.warn(`SFTP import failed for ${installationId}/${item.ref}: ${String(err)}`);
        await this.updateSyncState(installationId, 'connectors.sftpFetch.importFailed', null);
      }
    }
  }

  private async quarantineRemote(
    credentials: Record<string, string>,
    ref: string,
    filename: string,
    afterImport: string,
    archiveSubpath: string
  ): Promise<void> {
    try {
      await postProcessSftpPullFile(credentials, ref, filename, 'move', 'rejected');
    } catch {
      if (afterImport === 'delete') {
        await postProcessSftpPullFile(credentials, ref, filename, 'delete', archiveSubpath);
      }
    }
  }

  private async loadProcessedRefs(installationId: string): Promise<Set<string>> {
    const { rows } = await this.pool.query<{ processed_refs: string[] }>(
      `SELECT processed_refs FROM sftp_pull_sync_state WHERE installation_id = $1`,
      [installationId]
    );
    return new Set(rows[0]?.processed_refs ?? []);
  }

  private async saveProcessedRefs(installationId: string, refs: Set<string>): Promise<void> {
    const list = [...refs].slice(-500);
    await this.pool.query(
      `INSERT INTO sftp_pull_sync_state (installation_id, processed_refs)
       VALUES ($1, $2::text[])
       ON CONFLICT (installation_id) DO UPDATE SET processed_refs = EXCLUDED.processed_refs`,
      [installationId, list]
    );
  }

  private async updateSyncState(
    installationId: string,
    errorKey: string | null,
    lastRunAt: Date | null
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO sftp_pull_sync_state (installation_id, last_run_at, last_error_key)
       VALUES ($1, $2, $3)
       ON CONFLICT (installation_id) DO UPDATE SET
         last_run_at = COALESCE(EXCLUDED.last_run_at, sftp_pull_sync_state.last_run_at),
         last_error_key = EXCLUDED.last_error_key`,
      [installationId, lastRunAt, errorKey]
    );
  }
}

function advisoryKey(installationId: string): { high: number; low: number } {
  const hex = installationId.replace(/-/g, '');
  const high = Number.parseInt(hex.slice(0, 8), 16) | 0;
  const low = Number.parseInt(hex.slice(8, 16), 16) | 0;
  return { high, low };
}
