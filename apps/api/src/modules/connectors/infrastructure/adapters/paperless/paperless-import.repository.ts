// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import {
  parseBoolean,
  parseDate,
  parseEnum,
  parseNumber,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalString,
  parseString,
  recordFromUnknown,
  requireRecord,
} from '../../../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../../../shared/infrastructure/database/tokens.js';
import type { PaperlessOcrMode } from './paperless-field-mapping.js';

export type ConnectorImportRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

const CONNECTOR_IMPORT_RUN_STATUSES: readonly ConnectorImportRunStatus[] = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
];

const PAPERLESS_OCR_MODES: readonly PaperlessOcrMode[] = ['keep_paperless', 'rerun_docuvate'];

export interface ConnectorImportRunRow {
  id: string;
  installationId: string;
  userId: string;
  status: ConnectorImportRunStatus;
  paperlessApiVersion: number | null;
  ocrMode: PaperlessOcrMode;
  includeArchivedPdf: boolean;
  progressProcessed: number;
  progressTotal: number | null;
  resumePage: number;
  resumeModifiedCursor: Date | null;
  incrementalModifiedGt: Date | null;
  fatalErrorKey: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectorImportRunErrorRow {
  id: string;
  runId: string;
  sourceDocumentId: string;
  messageKey: string;
  messageDetail: string | null;
  createdAt: Date;
}

export interface PaperlessInstallationSettings {
  keepOcrText: boolean;
  rerunOcr: boolean;
  includeArchivedPdf: boolean;
}

const ENTITY_LINK_META: Record<string, { table: string; column: string }> = {
  tag: { table: 'connector_paperless_tag_links', column: 'tag_id' },
  document_type: { table: 'connector_paperless_document_type_links', column: 'tag_id' },
  correspondent: { table: 'connector_paperless_correspondent_links', column: 'correspondent_id' },
  storage_path: { table: 'connector_paperless_folder_links', column: 'folder_id' },
  custom_field: { table: 'connector_paperless_field_links', column: 'field_definition_id' },
};

const RUN_SELECT = `SELECT r.*, ci.user_id
  FROM connector_import_runs r
  JOIN connector_installations ci ON ci.id = r.installation_id`;

const STALE_RUNNING_MINUTES = 15;

function mapRun(row: Record<string, unknown>): ConnectorImportRunRow {
  return {
    id: parseString(row.id),
    installationId: parseString(row.installation_id),
    userId: parseString(row.user_id),
    status: parseEnum(row.status, CONNECTOR_IMPORT_RUN_STATUSES, 'pending'),
    paperlessApiVersion: parseOptionalNumber(row.paperless_api_version),
    ocrMode: parseEnum(row.ocr_mode, PAPERLESS_OCR_MODES, 'keep_paperless'),
    includeArchivedPdf: parseBoolean(row.include_archived_pdf),
    progressProcessed: parseNumber(row.progress_processed, 0),
    progressTotal: parseOptionalNumber(row.progress_total),
    resumePage: parseNumber(row.resume_page, 1),
    resumeModifiedCursor: parseOptionalDate(row.resume_modified_cursor),
    incrementalModifiedGt: parseOptionalDate(row.incremental_modified_gt),
    fatalErrorKey: parseOptionalString(row.fatal_error_key),
    startedAt: parseOptionalDate(row.started_at),
    completedAt: parseOptionalDate(row.completed_at),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
  };
}

function mapRunFromUnknown(raw: unknown): ConnectorImportRunRow {
  return mapRun(requireRecord(raw));
}

@Injectable()
export class PaperlessImportRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async ensurePaperlessSettings(installationId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO connector_paperless_settings (installation_id)
       VALUES ($1)
       ON CONFLICT (installation_id) DO NOTHING`,
      [installationId]
    );
  }

  async getInstallationSettings(
    installationId: string,
    userId: string
  ): Promise<PaperlessInstallationSettings | null> {
    const install = await this.pool.query(
      `SELECT id FROM connector_installations
       WHERE id = $1 AND user_id = $2 AND plugin_id = 'paperless'`,
      [installationId, userId]
    );
    if (!install.rows[0]) {
      return null;
    }
    await this.ensurePaperlessSettings(installationId);
    const result = await this.pool.query(
      `SELECT keep_ocr_text, rerun_ocr, include_archived_pdf
       FROM connector_paperless_settings WHERE installation_id = $1`,
      [installationId]
    );
    const row = recordFromUnknown(result.rows[0]);
    if (!row) {
      return null;
    }
    return {
      keepOcrText: parseBoolean(row.keep_ocr_text),
      rerunOcr: parseBoolean(row.rerun_ocr),
      includeArchivedPdf: parseBoolean(row.include_archived_pdf),
    };
  }

  async updateInstallationSettings(
    installationId: string,
    userId: string,
    settings: PaperlessInstallationSettings
  ): Promise<void> {
    await this.ensurePaperlessSettings(installationId);
    await this.pool.query(
      `UPDATE connector_paperless_settings ps
       SET keep_ocr_text = $3,
           rerun_ocr = $4,
           include_archived_pdf = $5
       FROM connector_installations ci
       WHERE ps.installation_id = ci.id
         AND ci.id = $1 AND ci.user_id = $2 AND ci.plugin_id = 'paperless'`,
      [installationId, userId, settings.keepOcrText, settings.rerunOcr, settings.includeArchivedPdf]
    );
  }

  async getSyncWatermark(installationId: string): Promise<Date | null> {
    const result = await this.pool.query(
      `SELECT last_successful_modified_at
       FROM connector_paperless_settings WHERE installation_id = $1`,
      [installationId]
    );
    const row = recordFromUnknown(result.rows[0]);
    return row ? parseOptionalDate(row.last_successful_modified_at) : null;
  }

  async countSourceDocuments(installationId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS count FROM connector_source_documents WHERE installation_id = $1`,
      [installationId]
    );
    const row = recordFromUnknown(result.rows[0]);
    return parseNumber(row?.count, 0);
  }

  async findActiveRunByInstallation(installationId: string): Promise<ConnectorImportRunRow | null> {
    const result = await this.pool.query(
      `${RUN_SELECT}
       WHERE r.installation_id = $1 AND r.status IN ('pending', 'running')
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [installationId]
    );
    const raw: unknown = result.rows[0];
    return raw !== undefined ? mapRunFromUnknown(raw) : null;
  }

  async findActiveRunForInstallation(
    installationId: string,
    userId: string
  ): Promise<ConnectorImportRunRow | null> {
    const result = await this.pool.query(
      `${RUN_SELECT}
       WHERE r.installation_id = $1 AND ci.user_id = $2 AND r.status IN ('pending', 'running')
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [installationId, userId]
    );
    const raw: unknown = result.rows[0];
    return raw !== undefined ? mapRunFromUnknown(raw) : null;
  }

  async createRun(input: {
    installationId: string;
    ocrMode: PaperlessOcrMode;
    includeArchivedPdf: boolean;
    incrementalModifiedGt?: Date | null;
  }): Promise<ConnectorImportRunRow> {
    const id = randomUUID();
    try {
      await this.pool.query(
        `INSERT INTO connector_import_runs (
           id, installation_id, status, ocr_mode, include_archived_pdf, incremental_modified_gt
         ) VALUES ($1, $2, 'pending', $3, $4, $5)`,
        [
          id,
          input.installationId,
          input.ocrMode,
          input.includeArchivedPdf,
          input.incrementalModifiedGt ?? null,
        ]
      );
    } catch (err: unknown) {
      const code = typeof err === 'object' && err !== null && 'code' in err ? err.code : null;
      if (code === '23505') {
        const active = await this.findActiveRunByInstallation(input.installationId);
        if (active) {
          return active;
        }
      }
      throw err;
    }
    const loaded = await this.findRunById(id);
    if (!loaded) {
      throw new Error('import run missing after insert');
    }
    return loaded;
  }

  async claimRunForProcessing(runId: string): Promise<boolean> {
    const stale = await this.pool.query(
      `UPDATE connector_import_runs
       SET status = 'running',
           started_at = COALESCE(started_at, now()),
           updated_at = now()
       WHERE id = $1 AND status = 'pending'
       RETURNING id`,
      [runId]
    );
    if (stale.rows[0]) {
      return true;
    }
    const reclaim = await this.pool.query(
      `UPDATE connector_import_runs
       SET status = 'running',
           updated_at = now()
       WHERE id = $1
         AND status = 'running'
         AND updated_at < now() - ($2::text || ' minutes')::interval
       RETURNING id`,
      [runId, String(STALE_RUNNING_MINUTES)]
    );
    return Boolean(reclaim.rows[0]);
  }

  async findRunById(runId: string): Promise<ConnectorImportRunRow | null> {
    const result = await this.pool.query(`${RUN_SELECT} WHERE r.id = $1`, [runId]);
    const raw: unknown = result.rows[0];
    return raw !== undefined ? mapRunFromUnknown(raw) : null;
  }

  async findRunForUser(runId: string, userId: string): Promise<ConnectorImportRunRow | null> {
    const result = await this.pool.query(`${RUN_SELECT} WHERE r.id = $1 AND ci.user_id = $2`, [
      runId,
      userId,
    ]);
    const raw: unknown = result.rows[0];
    return raw !== undefined ? mapRunFromUnknown(raw) : null;
  }

  async findLatestRunForInstallation(
    installationId: string,
    userId: string
  ): Promise<ConnectorImportRunRow | null> {
    const result = await this.pool.query(
      `${RUN_SELECT}
       WHERE r.installation_id = $1 AND ci.user_id = $2
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [installationId, userId]
    );
    const raw: unknown = result.rows[0];
    return raw !== undefined ? mapRunFromUnknown(raw) : null;
  }

  async markRunRunning(runId: string, apiVersion: number, progressTotal: number): Promise<void> {
    await this.pool.query(
      `UPDATE connector_import_runs
       SET status = 'running',
           paperless_api_version = $2,
           progress_total = $3,
           started_at = COALESCE(started_at, now()),
           updated_at = now()
       WHERE id = $1`,
      [runId, apiVersion, progressTotal]
    );
  }

  async updateRunProgress(
    runId: string,
    patch: {
      progressProcessed: number;
      resumePage: number;
      resumeModifiedCursor: Date | null;
    }
  ): Promise<void> {
    await this.pool.query(
      `UPDATE connector_import_runs
       SET progress_processed = $2,
           resume_page = $3,
           resume_modified_cursor = $4,
           updated_at = now()
       WHERE id = $1`,
      [runId, patch.progressProcessed, patch.resumePage, patch.resumeModifiedCursor]
    );
  }

  async completeRun(
    runId: string,
    installationId: string,
    status: 'completed' | 'failed' | 'cancelled',
    fatalErrorKey?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE connector_import_runs
       SET status = $2,
           fatal_error_key = $3,
           completed_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [runId, status, fatalErrorKey ?? null]
    );
    if (status === 'completed') {
      const errors = await this.pool.query(
        `SELECT COUNT(*)::int AS count FROM connector_import_run_errors WHERE run_id = $1`,
        [runId]
      );
      const errorRow = recordFromUnknown(errors.rows[0]);
      const errorCount = parseNumber(errorRow?.count, 0);
      if (errorCount === 0) {
        await this.ensurePaperlessSettings(installationId);
        await this.pool.query(
          `UPDATE connector_paperless_settings ps
           SET last_successful_modified_at = sub.max_modified
           FROM (
             SELECT MAX(source_modified_at) AS max_modified
             FROM connector_source_documents
             WHERE installation_id = $1
           ) sub
           WHERE ps.installation_id = $1`,
          [installationId]
        );
      }
    }
  }

  async addRunError(
    runId: string,
    sourceDocumentId: string,
    messageKey: string,
    messageDetail?: string
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO connector_import_run_errors (run_id, source_document_id, message_key, message_detail)
       VALUES ($1, $2, $3, $4)`,
      [runId, sourceDocumentId, messageKey, messageDetail ?? null]
    );
  }

  async listRunErrors(runId: string, limit = 200): Promise<ConnectorImportRunErrorRow[]> {
    const result = await this.pool.query(
      `SELECT id, run_id, source_document_id, message_key, message_detail, created_at
       FROM connector_import_run_errors
       WHERE run_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [runId, limit]
    );
    return result.rows.map((raw) => {
      const row = requireRecord(raw);
      return {
        id: parseString(row.id),
        runId: parseString(row.run_id),
        sourceDocumentId: parseString(row.source_document_id),
        messageKey: parseString(row.message_key),
        messageDetail: parseOptionalString(row.message_detail),
        createdAt: parseDate(row.created_at),
      };
    });
  }

  async findSourceLink(
    installationId: string,
    sourceDocumentId: string
  ): Promise<{ documentId: string; contentChecksum: string; sourceModifiedAt: Date } | null> {
    const result = await this.pool.query(
      `SELECT document_id, content_checksum, source_modified_at
       FROM connector_source_documents
       WHERE installation_id = $1 AND source_document_id = $2`,
      [installationId, sourceDocumentId]
    );
    const row = recordFromUnknown(result.rows[0]);
    if (!row) {
      return null;
    }
    return {
      documentId: parseString(row.document_id),
      contentChecksum: parseString(row.content_checksum),
      sourceModifiedAt: parseDate(row.source_modified_at),
    };
  }

  async upsertSourceLink(input: {
    installationId: string;
    sourceDocumentId: string;
    documentId: string;
    contentChecksum: string;
    sourceModifiedAt: Date;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO connector_source_documents (
         installation_id, source_document_id, document_id, content_checksum, source_modified_at
       ) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (installation_id, source_document_id) DO UPDATE SET
         document_id = EXCLUDED.document_id,
         content_checksum = EXCLUDED.content_checksum,
         source_modified_at = EXCLUDED.source_modified_at,
         updated_at = now()`,
      [
        input.installationId,
        input.sourceDocumentId,
        input.documentId,
        input.contentChecksum,
        input.sourceModifiedAt,
      ]
    );
  }

  async findEntityLink(
    installationId: string,
    entityKind: string,
    paperlessId: number
  ): Promise<string | null> {
    if (!(entityKind in ENTITY_LINK_META)) {
      return null;
    }
    const meta = ENTITY_LINK_META[entityKind];
    const result = await this.pool.query(
      `SELECT ${meta.column} AS local_id FROM ${meta.table}
       WHERE installation_id = $1 AND paperless_id = $2`,
      [installationId, paperlessId]
    );
    const row = recordFromUnknown(result.rows[0]);
    return row ? parseString(row.local_id) : null;
  }

  async upsertEntityLink(
    installationId: string,
    entityKind: string,
    paperlessId: number,
    localId: string
  ): Promise<void> {
    if (!(entityKind in ENTITY_LINK_META)) {
      return;
    }
    const meta = ENTITY_LINK_META[entityKind];
    await this.pool.query(
      `INSERT INTO ${meta.table} (installation_id, paperless_id, ${meta.column})
       VALUES ($1, $2, $3)
       ON CONFLICT (installation_id, paperless_id) DO UPDATE SET ${meta.column} = EXCLUDED.${meta.column}`,
      [installationId, paperlessId, localId]
    );
  }

  async setDocumentArchivedStorageKey(documentId: string, storageKey: string): Promise<void> {
    await this.pool.query(
      `UPDATE documents SET archived_storage_key = $2, updated_at = now() WHERE id = $1`,
      [documentId, storageKey]
    );
  }

  async ensureRecognizedFieldDefinition(
    userId: string,
    input: {
      key: string;
      label: string;
      fieldType: string;
      sortOrder: number;
    }
  ): Promise<string> {
    const existing = await this.pool.query(
      `SELECT id FROM recognized_field_definitions WHERE user_id = $1 AND field_key = $2`,
      [userId, input.key]
    );
    const existingRow = recordFromUnknown(existing.rows[0]);
    if (existingRow) {
      return parseString(existingRow.id);
    }
    const inserted = await this.pool.query(
      `INSERT INTO recognized_field_definitions
         (user_id, field_key, label, field_type, sort_order, extract_for_all_documents,
          gate_label_match, min_label_confidence, confidence_gate_enabled)
       VALUES ($1, $2, $3, $4, $5, false, 'any', NULL, NULL)
       RETURNING id`,
      [userId, input.key, input.label, input.fieldType, input.sortOrder]
    );
    const insertedRow = requireRecord(inserted.rows[0]);
    return parseString(insertedRow.id);
  }

  async resumePendingRuns(): Promise<ConnectorImportRunRow[]> {
    const result = await this.pool.query(
      `${RUN_SELECT}
       WHERE r.status = 'pending'
          OR (
            r.status = 'running'
            AND r.updated_at < now() - ($1::text || ' minutes')::interval
          )
       ORDER BY r.created_at ASC`,
      [String(STALE_RUNNING_MINUTES)]
    );
    return result.rows.map(mapRunFromUnknown);
  }
}
