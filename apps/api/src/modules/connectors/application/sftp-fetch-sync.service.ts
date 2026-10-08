import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
export class SftpFetchSyncService implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly runtime: ConnectorRuntimeResolver,
    private readonly uploadDocument: UploadDocumentUseCase
  ) {}

  onModuleInit(): void {
    const intervalMs = Number(process.env['DOCUVATE_SFTP_FETCH_SYNC_INTERVAL_MS'] ?? 60_000);
    if (intervalMs <= 0) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    void this.tick();
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
        await this.syncInstallation(row.id, row.user_id, decryptConnectorCredentials(row.credentials_encrypted));
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

    for (const item of importables) {
      const blob = await resolved.ports.source.fetchImportable(item.ref);
      const validation = validateScanFile(blob.filename, blob.buffer, maxBytes);
      if (!validation.ok) continue;
      await this.uploadDocument.execute({
        userId,
        filename: validation.filename,
        mimeType: validation.mimeType,
        buffer: blob.buffer,
        folderId,
        tagIds: labelIds?.length ? labelIds : undefined,
        ingestSource: 'scanner_sftp',
      });
      await postProcessSftpPullFile(
        credentials,
        item.ref,
        blob.filename,
        afterImport,
        archiveSubpath
      );
    }
  }
}
