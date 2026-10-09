// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
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

function mapFamily(row: Record<string, unknown>): MlModelFamilyEntity {
  return {
    id: String(row['id']),
    kind: String(row['kind']) as MlModelKind,
    displayName: String(row['display_name']),
    description: row['description'] == null ? null : String(row['description']),
  };
}

function metricsFromJson(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const num = Number(value);
    if (Number.isFinite(num)) {
      out[key] = num;
    }
  }
  return out;
}

function mapVersion(row: Record<string, unknown>): MlModelVersionEntity {
  return {
    id: String(row['id']),
    familyId: String(row['family_id']),
    versionTag: String(row['version_tag']),
    artifactUri: row['artifact_uri'] == null ? null : String(row['artifact_uri']),
    externalRunId: row['external_run_id'] == null ? null : String(row['external_run_id']),
    metrics: metricsFromJson(row['metrics']),
    lifecycle: String(row['lifecycle']) as MlModelLifecycle,
    trainingSnapshotId:
      row['training_snapshot_id'] == null ? null : String(row['training_snapshot_id']),
    notes: row['notes'] == null ? null : String(row['notes']),
    createdAt: new Date(String(row['created_at'])),
    promotedAt: row['promoted_at'] == null ? null : new Date(String(row['promoted_at'])),
  };
}

function mapJob(row: Record<string, unknown>): MlRetrainJobEntity {
  return {
    id: String(row['id']),
    familyId: String(row['family_id']),
    triggerKind: String(row['trigger_kind']) as MlRetrainTriggerKind,
    status: String(row['status']) as MlRetrainJobStatus,
    trainingSnapshotId:
      row['training_snapshot_id'] == null ? null : String(row['training_snapshot_id']),
    resultVersionId: row['result_version_id'] == null ? null : String(row['result_version_id']),
    errorMessage: row['error_message'] == null ? null : String(row['error_message']),
    createdAt: new Date(String(row['created_at'])),
    startedAt: row['started_at'] == null ? null : new Date(String(row['started_at'])),
    finishedAt: row['finished_at'] == null ? null : new Date(String(row['finished_at'])),
  };
}

@Injectable()
export class PgModelRegistryRepository implements ModelRegistryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listFamilies(): Promise<MlModelFamilyEntity[]> {
    const result = await this.pool.query(
      `SELECT id, kind, display_name, description FROM ml_model_families ORDER BY id ASC`
    );
    return result.rows.map((row) => mapFamily(row as Record<string, unknown>));
  }

  async findFamilyById(familyId: string): Promise<MlModelFamilyEntity | null> {
    const result = await this.pool.query(
      `SELECT id, kind, display_name, description FROM ml_model_families WHERE id = $1`,
      [familyId]
    );
    const row = result.rows[0];
    return row ? mapFamily(row as Record<string, unknown>) : null;
  }

  async listVersionsForFamily(familyId: string): Promise<MlModelVersionEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM ml_model_versions
       WHERE family_id = $1
       ORDER BY created_at DESC`,
      [familyId]
    );
    return result.rows.map((row) => mapVersion(row as Record<string, unknown>));
  }

  async findVersionById(versionId: string): Promise<MlModelVersionEntity | null> {
    const result = await this.pool.query(`SELECT * FROM ml_model_versions WHERE id = $1`, [
      versionId,
    ]);
    const row = result.rows[0];
    return row ? mapVersion(row as Record<string, unknown>) : null;
  }

  async getActiveVersionForFamily(familyId: string): Promise<MlModelVersionEntity | null> {
    const result = await this.pool.query(
      `SELECT * FROM ml_model_versions
       WHERE family_id = $1 AND lifecycle = 'active'
       ORDER BY promoted_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [familyId]
    );
    const row = result.rows[0];
    return row ? mapVersion(row as Record<string, unknown>) : null;
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
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundError('Model version');
    }
    return mapVersion(row as Record<string, unknown>);
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
    const saved = result.rows[0] as Record<string, unknown>;
    return {
      id: String(saved['id']),
      versionId: String(saved['version_id']),
      baselineVersionId:
        saved['baseline_version_id'] == null ? null : String(saved['baseline_version_id']),
      metricName: String(saved['metric_name']),
      baselineValue: saved['baseline_value'] == null ? null : Number(saved['baseline_value']),
      candidateValue: saved['candidate_value'] == null ? null : Number(saved['candidate_value']),
      maxAllowedDrop: Number(saved['max_allowed_drop']),
      passed: Boolean(saved['passed']),
      evaluatedAt: new Date(String(saved['evaluated_at'])),
    };
  }

  async listRecentJobs(familyId: string, limit: number): Promise<MlRetrainJobEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM ml_retrain_jobs
       WHERE family_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [familyId, limit]
    );
    return result.rows.map((row) => mapJob(row as Record<string, unknown>));
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
    return mapJob(result.rows[0] as Record<string, unknown>);
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
      fields.push(`status = $${idx++}`);
      params.push(patch.status);
    }
    if (patch.trainingSnapshotId !== undefined) {
      fields.push(`training_snapshot_id = $${idx++}`);
      params.push(patch.trainingSnapshotId);
    }
    if (patch.resultVersionId !== undefined) {
      fields.push(`result_version_id = $${idx++}`);
      params.push(patch.resultVersionId);
    }
    if (patch.errorMessage !== undefined) {
      fields.push(`error_message = $${idx++}`);
      params.push(patch.errorMessage);
    }
    if (patch.startedAt !== undefined) {
      fields.push(`started_at = $${idx++}`);
      params.push(patch.startedAt);
    }
    if (patch.finishedAt !== undefined) {
      fields.push(`finished_at = $${idx++}`);
      params.push(patch.finishedAt);
    }
    if (fields.length === 0) {
      const existing = await this.pool.query(`SELECT * FROM ml_retrain_jobs WHERE id = $1`, [
        jobId,
      ]);
      const row = existing.rows[0];
      if (!row) {
        throw new NotFoundError('Retrain job');
      }
      return mapJob(row as Record<string, unknown>);
    }
    const result = await this.pool.query(
      `UPDATE ml_retrain_jobs SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundError('Retrain job');
    }
    return mapJob(row as Record<string, unknown>);
  }

  async countCorrectionsSince(since: Date | null): Promise<number> {
    const result =
      since === null
        ? await this.pool.query(`SELECT COUNT(*)::int AS c FROM extraction_field_corrections`)
        : await this.pool.query(
            `SELECT COUNT(*)::int AS c FROM extraction_field_corrections WHERE created_at > $1`,
            [since]
          );
    return Number((result.rows[0] as Record<string, unknown>)['c'] ?? 0);
  }

  async lastSnapshotWatermarkForFamily(familyId: string): Promise<Date | null> {
    const result = await this.pool.query(
      `SELECT source_watermark FROM ml_training_data_snapshots
       WHERE family_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [familyId]
    );
    const raw = (result.rows[0] as Record<string, unknown> | undefined)?.['source_watermark'];
    return raw == null ? null : new Date(String(raw));
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
    return { id: String((result.rows[0] as Record<string, unknown>)['id']) };
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
    return mapVersion(result.rows[0] as Record<string, unknown>);
  }
}
