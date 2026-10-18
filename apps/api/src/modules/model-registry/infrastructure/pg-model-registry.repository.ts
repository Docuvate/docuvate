// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  isRecord,
  parseBoolean,
  parseDate,
  parseEnum,
  parseNumber,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { ModelRegistryRepository } from '../domain/model-registry.repository.port.js';
import type {
  MlCanaryEvaluationEntity,
  MlModelFamilyEntity,
  MlModelKind,
  MlModelLifecycle,
  MlModelVersionEntity,
  MlRetrainJobEntity,
  MlRetrainJobStatus,
  MlRetrainTriggerKind,
} from '../domain/model-registry.types.js';

const ML_MODEL_KINDS: readonly MlModelKind[] = ['ocr', 'embedding', 'docqa', 'field_extractor'];
const ML_MODEL_LIFECYCLES: readonly MlModelLifecycle[] = [
  'registered',
  'canary',
  'active',
  'archived',
  'failed',
];
const ML_RETRAIN_TRIGGER_KINDS: readonly MlRetrainTriggerKind[] = ['cron', 'threshold', 'manual'];
const ML_RETRAIN_JOB_STATUSES: readonly MlRetrainJobStatus[] = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
];

function mapFamily(row: Record<string, unknown>): MlModelFamilyEntity {
  return {
    id: parseString(row.id),
    kind: parseEnum(row.kind, ML_MODEL_KINDS, 'ocr'),
    displayName: parseString(row.display_name),
    description: parseOptionalString(row.description),
  };
}

function metricsFromJson(raw: unknown): Record<string, number> {
  if (!isRecord(raw)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const num = parseNumber(value, Number.NaN);
    if (Number.isFinite(num)) {
      out[key] = num;
    }
  }
  return out;
}

function mapVersion(row: Record<string, unknown>): MlModelVersionEntity {
  return {
    id: parseString(row.id),
    familyId: parseString(row.family_id),
    versionTag: parseString(row.version_tag),
    artifactUri: parseOptionalString(row.artifact_uri),
    externalRunId: parseOptionalString(row.external_run_id),
    metrics: metricsFromJson(row.metrics),
    lifecycle: parseEnum(row.lifecycle, ML_MODEL_LIFECYCLES, 'registered'),
    trainingSnapshotId: parseOptionalString(row.training_snapshot_id),
    notes: parseOptionalString(row.notes),
    createdAt: parseDate(row.created_at),
    promotedAt: parseOptionalDate(row.promoted_at),
  };
}

function mapJob(row: Record<string, unknown>): MlRetrainJobEntity {
  return {
    id: parseString(row.id),
    familyId: parseString(row.family_id),
    triggerKind: parseEnum(row.trigger_kind, ML_RETRAIN_TRIGGER_KINDS, 'manual'),
    status: parseEnum(row.status, ML_RETRAIN_JOB_STATUSES, 'queued'),
    trainingSnapshotId: parseOptionalString(row.training_snapshot_id),
    resultVersionId: parseOptionalString(row.result_version_id),
    errorMessage: parseOptionalString(row.error_message),
    createdAt: parseDate(row.created_at),
    startedAt: parseOptionalDate(row.started_at),
    finishedAt: parseOptionalDate(row.finished_at),
  };
}

function mapCanaryEvaluation(row: Record<string, unknown>): MlCanaryEvaluationEntity {
  return {
    id: parseString(row.id),
    versionId: parseString(row.version_id),
    baselineVersionId: parseOptionalString(row.baseline_version_id),
    metricName: parseString(row.metric_name),
    baselineValue: parseOptionalNumber(row.baseline_value),
    candidateValue: parseOptionalNumber(row.candidate_value),
    maxAllowedDrop: parseNumber(row.max_allowed_drop),
    passed: parseBoolean(row.passed),
    evaluatedAt: parseDate(row.evaluated_at),
  };
}

@Injectable()
export class PgModelRegistryRepository implements ModelRegistryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listFamilies(): Promise<MlModelFamilyEntity[]> {
    const result = await this.pool.query(
      `SELECT id, kind, display_name, description FROM ml_model_families ORDER BY id ASC`
    );
    return result.rows.map((row) => mapFamily(requireRecord(row)));
  }

  async findFamilyById(familyId: string): Promise<MlModelFamilyEntity | null> {
    const result = await this.pool.query(
      `SELECT id, kind, display_name, description FROM ml_model_families WHERE id = $1`,
      [familyId]
    );
    const raw: unknown = result.rows[0];
    return raw !== undefined ? mapFamily(requireRecord(raw)) : null;
  }

  async listVersionsForFamily(familyId: string): Promise<MlModelVersionEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM ml_model_versions
       WHERE family_id = $1
       ORDER BY created_at DESC`,
      [familyId]
    );
    return result.rows.map((row) => mapVersion(requireRecord(row)));
  }

  async findVersionById(versionId: string): Promise<MlModelVersionEntity | null> {
    const result = await this.pool.query(`SELECT * FROM ml_model_versions WHERE id = $1`, [
      versionId,
    ]);
    const raw: unknown = result.rows[0];
    return raw !== undefined ? mapVersion(requireRecord(raw)) : null;
  }

  async getActiveVersionForFamily(familyId: string): Promise<MlModelVersionEntity | null> {
    const result = await this.pool.query(
      `SELECT * FROM ml_model_versions
       WHERE family_id = $1 AND lifecycle = 'active'
       ORDER BY promoted_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [familyId]
    );
    const raw: unknown = result.rows[0];
    return raw !== undefined ? mapVersion(requireRecord(raw)) : null;
  }

  async setVersionLifecycle(
    versionId: string,
    lifecycle: MlModelLifecycle
  ): Promise<MlModelVersionEntity> {
    const promotedAt = lifecycle === 'active' ? new Date() : null;
    const result = await this.pool.query(
      `UPDATE ml_model_versions
       SET lifecycle = $2,
           promoted_at = CASE WHEN $2 = 'active' THEN COALESCE($3, now()) ELSE promoted_at END
       WHERE id = $1
       RETURNING *`,
      [versionId, lifecycle, promotedAt]
    );
    const raw: unknown = result.rows[0];
    if (raw === undefined) {
      throw new NotFoundError('Model version');
    }
    return mapVersion(requireRecord(raw));
  }

  async archiveActiveForFamily(familyId: string, exceptVersionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE ml_model_versions
       SET lifecycle = 'archived'
       WHERE family_id = $1 AND lifecycle = 'active' AND id <> $2`,
      [familyId, exceptVersionId]
    );
  }

  async insertCanaryEvaluation(
    row: Omit<MlCanaryEvaluationEntity, 'id' | 'evaluatedAt'>
  ): Promise<MlCanaryEvaluationEntity> {
    const result = await this.pool.query(
      `INSERT INTO ml_canary_evaluations (
         version_id, baseline_version_id, metric_name,
         baseline_value, candidate_value, max_allowed_drop, passed
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        row.versionId,
        row.baselineVersionId,
        row.metricName,
        row.baselineValue,
        row.candidateValue,
        row.maxAllowedDrop,
        row.passed,
      ]
    );
    return mapCanaryEvaluation(requireRecord(result.rows[0]));
  }

  async listRecentJobs(familyId: string, limit: number): Promise<MlRetrainJobEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM ml_retrain_jobs
       WHERE family_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [familyId, limit]
    );
    return result.rows.map((row) => mapJob(requireRecord(row)));
  }

  async createRetrainJob(
    familyId: string,
    triggerKind: MlRetrainTriggerKind
  ): Promise<MlRetrainJobEntity> {
    const result = await this.pool.query(
      `INSERT INTO ml_retrain_jobs (family_id, trigger_kind, status)
       VALUES ($1, $2, 'queued')
       RETURNING *`,
      [familyId, triggerKind]
    );
    return mapJob(requireRecord(result.rows[0]));
  }

  async updateRetrainJob(
    jobId: string,
    patch: Partial<
      Pick<
        MlRetrainJobEntity,
        | 'status'
        | 'trainingSnapshotId'
        | 'resultVersionId'
        | 'errorMessage'
        | 'startedAt'
        | 'finishedAt'
      >
    >
  ): Promise<MlRetrainJobEntity> {
    const fields: string[] = [];
    const params: unknown[] = [jobId];
    let idx = 2;
    if (patch.status !== undefined) {
      fields.push(`status = $${String(idx)}`);
      idx += 1;
      params.push(patch.status);
    }
    if (patch.trainingSnapshotId !== undefined) {
      fields.push(`training_snapshot_id = $${String(idx)}`);
      idx += 1;
      params.push(patch.trainingSnapshotId);
    }
    if (patch.resultVersionId !== undefined) {
      fields.push(`result_version_id = $${String(idx)}`);
      idx += 1;
      params.push(patch.resultVersionId);
    }
    if (patch.errorMessage !== undefined) {
      fields.push(`error_message = $${String(idx)}`);
      idx += 1;
      params.push(patch.errorMessage);
    }
    if (patch.startedAt !== undefined) {
      fields.push(`started_at = $${String(idx)}`);
      idx += 1;
      params.push(patch.startedAt);
    }
    if (patch.finishedAt !== undefined) {
      fields.push(`finished_at = $${String(idx)}`);
      idx += 1;
      params.push(patch.finishedAt);
    }
    if (fields.length === 0) {
      const existing = await this.pool.query(`SELECT * FROM ml_retrain_jobs WHERE id = $1`, [
        jobId,
      ]);
      const existingRaw: unknown = existing.rows[0];
      if (existingRaw === undefined) {
        throw new NotFoundError('Retrain job');
      }
      return mapJob(requireRecord(existingRaw));
    }
    const result = await this.pool.query(
      `UPDATE ml_retrain_jobs SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );
    const raw: unknown = result.rows[0];
    if (raw === undefined) {
      throw new NotFoundError('Retrain job');
    }
    return mapJob(requireRecord(raw));
  }

  async countCorrectionsSince(since: Date | null): Promise<number> {
    const result =
      since === null
        ? await this.pool.query(`SELECT COUNT(*)::int AS c FROM extraction_field_corrections`)
        : await this.pool.query(
            `SELECT COUNT(*)::int AS c FROM extraction_field_corrections WHERE created_at > $1`,
            [since]
          );
    const row = requireRecord(result.rows[0]);
    return parseNumber(row.c, 0);
  }

  async lastSnapshotWatermarkForFamily(familyId: string): Promise<Date | null> {
    const result = await this.pool.query(
      `SELECT source_watermark FROM ml_training_data_snapshots
       WHERE family_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [familyId]
    );
    const raw: unknown = result.rows[0];
    if (raw === undefined) {
      return null;
    }
    const row = requireRecord(raw);
    return parseOptionalDate(row.source_watermark);
  }

  async insertTrainingSnapshot(input: {
    familyId: string;
    datasetVersion: string;
    sourceWatermark: Date | null;
    rowCount: number;
    storageUri: string | null;
    metadata: Record<string, unknown>;
  }): Promise<{ id: string }> {
    const result = await this.pool.query(
      `INSERT INTO ml_training_data_snapshots (
         family_id, dataset_version, source_watermark, row_count, storage_uri, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING id`,
      [
        input.familyId,
        input.datasetVersion,
        input.sourceWatermark,
        input.rowCount,
        input.storageUri,
        JSON.stringify(input.metadata),
      ]
    );
    const row = requireRecord(result.rows[0]);
    return { id: parseString(row.id) };
  }

  async registerModelVersion(input: {
    familyId: string;
    versionTag: string;
    artifactUri: string | null;
    externalRunId: string | null;
    metrics: Record<string, number>;
    trainingSnapshotId: string;
    notes: string | null;
  }): Promise<MlModelVersionEntity> {
    const result = await this.pool.query(
      `INSERT INTO ml_model_versions (
         family_id, version_tag, artifact_uri, external_run_id, metrics,
         lifecycle, training_snapshot_id, notes
       ) VALUES ($1, $2, $3, $4, $5::jsonb, 'registered', $6, $7)
       RETURNING *`,
      [
        input.familyId,
        input.versionTag,
        input.artifactUri,
        input.externalRunId,
        JSON.stringify(input.metrics),
        input.trainingSnapshotId,
        input.notes,
      ]
    );
    return mapVersion(requireRecord(result.rows[0]));
  }
}
