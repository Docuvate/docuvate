// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from '../../src/shared/infrastructure/database/typeorm-options.js';
import { PgEmbeddingDensityRepository } from '../../src/modules/labels/infrastructure/pg-embedding-density.repository.js';
import { EmbeddingDensityUserStateEntity } from '../../src/shared/infrastructure/database/entities/embedding-density-user-state.entity.js';
import { EmbeddingDensityClassNiwEntity } from '../../src/shared/infrastructure/database/entities/embedding-density-class-niw.entity.js';
import { EmbeddingDensityDecisionThresholdEntity } from '../../src/shared/infrastructure/database/entities/embedding-density-decision-threshold.entity.js';
import { EmbeddingDensityLabelGroupMemberEntity } from '../../src/shared/infrastructure/database/entities/embedding-density-label-group-member.entity.js';
import { EmbeddingDensityCorrectionEntity } from '../../src/shared/infrastructure/database/entities/embedding-density-correction.entity.js';
import { EmbeddingDensityCorrectionOffsetEntity } from '../../src/shared/infrastructure/database/entities/embedding-density-correction-offset.entity.js';
import { EmbeddingDensityCalibrationRunEntity } from '../../src/shared/infrastructure/database/entities/embedding-density-calibration-run.entity.js';
import { EmbeddingDensityLabelGroupEntity } from '../../src/shared/infrastructure/database/entities/embedding-density-label-group.entity.js';
import { DocumentEmbeddingsEntity } from '../../src/shared/infrastructure/database/entities/document-embeddings.entity.js';
import { TagsEntity } from '../../src/shared/infrastructure/database/entities/tags.entity.js';
import type { EmbeddingDensityWorkerState } from '../../src/modules/labels/domain/embedding-density-worker-state.schema.js';
import { RecordEmbeddingDensityCorrectionUseCase } from '../../src/modules/labels/application/record-embedding-density-correction.use-case.js';
import { HttpEmbeddingDensityAdapter } from '../../src/modules/labels/infrastructure/http-embedding-density.adapter.js';
import { EmbeddingDensityCalibrationQueueService } from '../../src/modules/labels/infrastructure/embedding-density-calibration-queue.service.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';

class FakeEmbeddingDensityWorker implements Pick<HttpEmbeddingDensityAdapter, 'correct'> {
  async correct(
    state: EmbeddingDensityWorkerState,
    vector: number[],
    targetLabelId: string
  ): Promise<EmbeddingDensityWorkerState> {
    const next = structuredClone(state);
    next.kernel.points.push(vector);
    const offset = state.label_ids.map((id) => (id === targetLabelId ? 1 : -1));
    next.kernel.label_offsets.push(offset);
    return next;
  }
}

class NoOpCalibrationQueue implements Pick<
  EmbeddingDensityCalibrationQueueService,
  'scheduleUserCalibration'
> {
  async scheduleUserCalibration(_userId: string): Promise<void> {
    return undefined;
  }
}

function createDensityRepository(dataSource: DataSource): PgEmbeddingDensityRepository {
  return new PgEmbeddingDensityRepository(
    dataSource.getRepository(EmbeddingDensityUserStateEntity),
    dataSource.getRepository(EmbeddingDensityClassNiwEntity),
    dataSource.getRepository(EmbeddingDensityDecisionThresholdEntity),
    dataSource.getRepository(EmbeddingDensityLabelGroupMemberEntity),
    dataSource.getRepository(EmbeddingDensityCorrectionEntity),
    dataSource.getRepository(EmbeddingDensityCorrectionOffsetEntity),
    dataSource.getRepository(DocumentEmbeddingsEntity),
    dataSource.getRepository(TagsEntity),
    dataSource.getRepository(EmbeddingDensityCalibrationRunEntity),
    dataSource.getRepository(EmbeddingDensityLabelGroupEntity),
    dataSource.getRepository(EmbeddingDensityLabelGroupMemberEntity)
  );
}

describe('PgEmbeddingDensityRepository org isolation (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let dataSource: DataSource;
  let repo: PgEmbeddingDensityRepository;
  let userA: string;
  let userB: string;
  const tagA = randomUUID();
  const tagB = randomUUID();
  const docA = randomUUID();
  const vectorA = [0.9, 0.1, 0.0, 0.0];

  beforeAll(async () => {
    dataSource = new DataSource(buildTypeOrmOptions());
    await dataSource.initialize();
    repo = createDensityRepository(dataSource);
    userA = newIsolationUserId();
    userB = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userA,
        name: 'Org A',
        email: `${userA}@example.test`,
      });
      await insertSyntheticUser(client, {
        id: userB,
        name: 'Org B',
        email: `${userB}@example.test`,
      });
    } finally {
      client.release();
    }
    await pool.query(
      `INSERT INTO tags (id, user_id, name, is_inbox) VALUES ($1, $2, 'TagA', false), ($3, $4, 'TagB', false)`,
      [tagA, userA, tagB, userB]
    );
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'a.pdf', 'application/pdf', 'ka', 'ready'),
              ($3, $4, 'b.pdf', 'application/pdf', 'kb', 'ready')`,
      [docA, userA, randomUUID(), userB]
    );
    await pool.query(
      `INSERT INTO document_embeddings (document_id, model, embedding)
       VALUES ($1, 'test', $2::jsonb)`,
      [docA, JSON.stringify(vectorA)]
    );
    await pool.query(
      `INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2)`,
      [docA, tagA]
    );
    const baseState: EmbeddingDensityWorkerState = {
      label_ids: [tagA],
      dim: 4,
      temperature: 1,
      class_bias: [0],
      novelty_threshold: Number.NEGATIVE_INFINITY,
      coarse_ready: true,
      fine_ready: { [tagA]: true },
      label_to_group: { [tagA]: tagA },
      log_priors: { [tagA]: 0 },
      class_stats: {},
      coarse_thresholds: {},
      fine_thresholds: {},
      kernel: { bandwidth: 0.5, points: [], label_offsets: [] },
    };
    const baseStateB: EmbeddingDensityWorkerState = {
      label_ids: [tagB],
      dim: 4,
      temperature: 1,
      class_bias: [0],
      novelty_threshold: Number.NEGATIVE_INFINITY,
      coarse_ready: true,
      fine_ready: { [tagB]: true },
      label_to_group: { [tagB]: tagB },
      log_priors: { [tagB]: 0 },
      class_stats: {},
      coarse_thresholds: {},
      fine_thresholds: {},
      kernel: {
        bandwidth: 0.5,
        points: [[0.2, 0.1, 0.0, 0.0]],
        label_offsets: [[0.5]],
      },
    };
    await repo.persistWorkerState(userA, baseState);
    await repo.persistWorkerState(userB, baseStateB);
  }, 120_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userA);
    await deleteSyntheticUser(pool, userB);
    await dataSource.destroy();
    await closeIntegrationPool();
  });

  it('user B worker state is unchanged after correction and calibration for user A', async () => {
    const bBefore = await repo.loadWorkerState(userB, [tagB]);
    expect(bBefore).not.toBeNull();

    const correction = new RecordEmbeddingDensityCorrectionUseCase(
      repo,
      new FakeEmbeddingDensityWorker(),
      new NoOpCalibrationQueue()
    );
    process.env['EMBEDDING_DENSITY_SUGGESTIONS_ENABLED'] = 'true';
    await correction.recordLabelCorrection({
      userId: userA,
      documentId: docA,
      vector: vectorA,
      fromTagId: null,
      toTagId: tagA,
      createdBy: userA,
    });

    const aLoaded = await repo.loadWorkerState(userA, [tagA]);
    if (!aLoaded) {
      throw new Error('expected user A worker state');
    }
    await repo.persistCalibrationBundle(
      userA,
      {
        ...aLoaded,
        coarse_thresholds: {
          top_group: {
            scope: 'coarse',
            target_id: 'top_group',
            threshold: 0.9,
            lower_bound: 0.99,
            coverage: 0.3,
          },
        },
      },
      { nDocuments: 1, nExamples: 1, delta: 0.05 }
    );

    const bAfter = await repo.loadWorkerState(userB, [tagB]);
    expect(JSON.stringify(bAfter)).toBe(JSON.stringify(bBefore));

    const crossLoad = await repo.loadWorkerState(userB, [tagA]);
    expect(crossLoad?.kernel.points.length ?? 0).toBe(0);
    expect(
      await dataSource.getRepository(EmbeddingDensityCorrectionEntity).count({
        where: { userId: userB, toTagId: tagA },
      })
    ).toBe(0);

    const aState = await repo.loadWorkerState(userA, [tagA]);
    expect(aState?.kernel.points.length).toBe(1);

    const aCorrections = await dataSource.getRepository(EmbeddingDensityCorrectionEntity).find({
      where: { userId: userA },
    });
    expect(aCorrections).toHaveLength(1);
    const bCorrections = await dataSource.getRepository(EmbeddingDensityCorrectionEntity).find({
      where: { userId: userB },
    });
    expect(bCorrections).toHaveLength(0);
  });
});
